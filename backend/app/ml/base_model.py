"""Abstract base class for all RCM Pulse ML models."""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class ModelMetadata:
    """Immutable snapshot of model metadata."""

    __slots__ = ("name", "version", "created_at", "metrics", "feature_names")

    def __init__(
        self,
        name: str,
        version: str = "0.1.0",
        created_at: datetime | None = None,
        metrics: dict[str, float] | None = None,
        feature_names: list[str] | None = None,
    ) -> None:
        self.name = name
        self.version = version
        self.created_at = created_at or datetime.now(timezone.utc)
        self.metrics = metrics or {}
        self.feature_names = feature_names or []

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "version": self.version,
            "created_at": self.created_at.isoformat(),
            "metrics": self.metrics,
            "feature_names": self.feature_names,
        }


class BaseModel(ABC):
    """Abstract base class that every RCM Pulse ML model must extend.

    Subclasses implement ``train``, ``predict``, and optionally override
    ``feature_importance``.  Serialization is handled via *joblib*.
    """

    def __init__(self, name: str, version: str = "0.1.0") -> None:
        self.metadata = ModelMetadata(name=name, version=version)
        self._is_fitted: bool = False

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    def train(self, X: pd.DataFrame, y: pd.Series) -> dict[str, float]:
        """Fit the model and return a metrics dict (e.g. accuracy, f1)."""

    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Return predictions for the given feature matrix."""

    # ------------------------------------------------------------------
    # Optional overrides
    # ------------------------------------------------------------------

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Return class probabilities.  Override for classifiers."""
        raise NotImplementedError(
            f"{self.metadata.name} does not support predict_proba"
        )

    def feature_importance(self) -> dict[str, float]:
        """Return a mapping of feature name -> importance score.

        The default implementation returns an empty dict; subclasses that wrap
        tree-based or linear models should override this.
        """
        return {}

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def save(self, path: str | Path) -> Path:
        """Persist the model to disk using joblib.

        Parameters
        ----------
        path:
            File path (will be created / overwritten).  Parent directories are
            created automatically.

        Returns
        -------
        Path
            The resolved path the model was written to.
        """
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "model": self,
            "metadata": self.metadata.to_dict(),
        }
        joblib.dump(payload, path)
        logger.info("Model '%s' v%s saved to %s", self.metadata.name, self.metadata.version, path)
        return path

    @classmethod
    def load(cls, path: str | Path) -> "BaseModel":
        """Deserialize a model previously saved with :meth:`save`.

        Returns
        -------
        BaseModel
            The reconstituted model instance (with metadata intact).

        Raises
        ------
        FileNotFoundError
            If *path* does not exist.
        ValueError
            If the file does not contain a valid model payload.
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"No model file at {path}")

        payload = joblib.load(path)

        if not isinstance(payload, dict) or "model" not in payload:
            raise ValueError(f"Invalid model file at {path}")

        model: BaseModel = payload["model"]
        logger.info("Model '%s' v%s loaded from %s", model.metadata.name, model.metadata.version, path)
        return model

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _check_fitted(self) -> None:
        if not self._is_fitted:
            raise RuntimeError(
                f"Model '{self.metadata.name}' has not been trained yet. "
                "Call train() first."
            )

    def __repr__(self) -> str:
        return (
            f"<{self.__class__.__name__} name={self.metadata.name!r} "
            f"version={self.metadata.version!r} fitted={self._is_fitted}>"
        )
