"""In-memory model registry with automatic disk persistence.

Models are kept in a dictionary keyed by name.  On ``register`` the model is
also serialized to ``backend/ml_models/<name>.joblib`` so it survives process
restarts.  On first import the registry scans that directory and loads any
previously saved models.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.ml.base_model import BaseModel

logger = logging.getLogger(__name__)

# Default persistence directory — resolved relative to the backend root.
_DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[2] / "ml_models"


class _RegistryEntry:
    """Internal bookkeeping for a single registered model."""

    __slots__ = ("model", "path", "metrics", "trained_at")

    def __init__(
        self,
        model: BaseModel,
        path: Path,
        metrics: dict[str, float],
        trained_at: datetime,
    ) -> None:
        self.model = model
        self.path = path
        self.metrics = metrics
        self.trained_at = trained_at

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.model.metadata.name,
            "version": self.model.metadata.version,
            "path": str(self.path),
            "metrics": self.metrics,
            "trained_at": self.trained_at.isoformat(),
        }


class ModelRegistry:
    """Singleton-style model registry.

    Usage::

        registry = ModelRegistry()          # uses default ml_models/ dir
        registry.register("denial_v1", my_model, {"f1": 0.87})
        model = registry.get("denial_v1")
        print(registry.list_models())
    """

    def __init__(self, model_dir: str | Path | None = None) -> None:
        self._model_dir = Path(model_dir) if model_dir else _DEFAULT_MODEL_DIR
        self._model_dir.mkdir(parents=True, exist_ok=True)
        self._models: dict[str, _RegistryEntry] = {}
        self._load_existing()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(
        self,
        name: str,
        model: BaseModel,
        metrics: dict[str, float] | None = None,
    ) -> Path:
        """Register (and persist) a trained model.

        Parameters
        ----------
        name:
            Unique logical name, e.g. ``"denial_predictor_v2"``.
        model:
            A fitted :class:`BaseModel` subclass.
        metrics:
            Optional evaluation metrics to store alongside the model.

        Returns
        -------
        Path
            The path the model was saved to.
        """
        metrics = metrics or {}
        model.metadata.metrics = metrics
        path = self._model_dir / f"{name}.joblib"
        model.save(path)

        entry = _RegistryEntry(
            model=model,
            path=path,
            metrics=metrics,
            trained_at=datetime.now(timezone.utc),
        )
        self._models[name] = entry
        logger.info("Registered model '%s' (metrics=%s)", name, metrics)
        return path

    def get(self, name: str) -> BaseModel:
        """Retrieve a model by name.

        Raises
        ------
        KeyError
            If no model is registered under *name*.
        """
        if name not in self._models:
            raise KeyError(
                f"Model '{name}' not found in registry. "
                f"Available: {list(self._models)}"
            )
        return self._models[name].model

    def list_models(self) -> list[dict[str, Any]]:
        """Return metadata for every registered model."""
        return [entry.to_dict() for entry in self._models.values()]

    def remove(self, name: str) -> None:
        """Un-register a model and delete its persisted file."""
        if name not in self._models:
            raise KeyError(f"Model '{name}' not found in registry.")

        entry = self._models.pop(name)
        if entry.path.exists():
            entry.path.unlink()
            logger.info("Deleted model file %s", entry.path)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _load_existing(self) -> None:
        """Scan the model directory and load any ``.joblib`` files."""
        for path in sorted(self._model_dir.glob("*.joblib")):
            name = path.stem
            try:
                model = BaseModel.load(path)
                self._models[name] = _RegistryEntry(
                    model=model,
                    path=path,
                    metrics=model.metadata.metrics,
                    trained_at=model.metadata.created_at,
                )
                logger.info("Auto-loaded model '%s' from %s", name, path)
            except Exception:
                logger.exception("Failed to load model from %s — skipping", path)

    def __len__(self) -> int:
        return len(self._models)

    def __contains__(self, name: str) -> bool:
        return name in self._models

    def __repr__(self) -> str:
        return f"<ModelRegistry models={list(self._models)} dir={self._model_dir}>"
