"""
RCM Continuous Simulation Scheduler

Runs continuously in the background:
1. Every 15 min: Refresh RCM knowledge graph from live DB via Graphiti
2. Every 30 min: Run all 5 simulation scenarios with latest data
3. On-demand: Validate suggestions before showing to users
4. Daily: Generate comprehensive ReACT report

Uses asyncio background tasks (no external scheduler dependency).
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

from ..utils.logger import get_logger
from ..config import Config

logger = get_logger('mirofish.rcm_scheduler')


@dataclass
class SchedulerState:
    running: bool = False
    started_at: Optional[str] = None
    last_graph_refresh: Optional[str] = None
    last_simulation_run: Optional[str] = None
    last_report_generated: Optional[str] = None
    graph_refresh_count: int = 0
    simulation_run_count: int = 0
    report_count: int = 0
    errors: List[str] = field(default_factory=list)
    latest_results: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "running": self.running,
            "started_at": self.started_at,
            "last_graph_refresh": self.last_graph_refresh,
            "last_simulation_run": self.last_simulation_run,
            "last_report_generated": self.last_report_generated,
            "graph_refresh_count": self.graph_refresh_count,
            "simulation_run_count": self.simulation_run_count,
            "report_count": self.report_count,
            "recent_errors": self.errors[-5:],
            "scenarios_cached": list(self.latest_results.keys())
        }


class RCMScheduler:
    """Continuous background scheduler for RCM agent swarm"""

    def __init__(self):
        self.state = SchedulerState()
        self._graph_task: Optional[asyncio.Task] = None
        self._sim_task: Optional[asyncio.Task] = None
        self._report_task: Optional[asyncio.Task] = None
        self._graph_interval = Config.RCM_GRAPH_REFRESH_MINUTES * 60
        self._sim_interval = Config.RCM_SIM_INTERVAL_MINUTES * 60
        self._report_interval = 86400  # 24 hours
        self._scenarios = self._load_scenarios()

    def _load_scenarios(self) -> List[Dict]:
        """Load simulation scenarios from seed file"""
        path = os.path.join(
            os.path.dirname(__file__), '..', '..', '..',
            'rcm_seeds', 'simulation_scenarios.json'
        )
        try:
            with open(path, 'r') as f:
                data = json.load(f)
            scenarios = data if isinstance(data, list) else data.get('scenarios', [])
            logger.info(f"Loaded {len(scenarios)} simulation scenarios")
            return scenarios
        except Exception as e:
            logger.error(f"Failed to load scenarios: {e}")
            return []

    async def start(self):
        """Start all background loops"""
        if self.state.running:
            logger.warning("Scheduler already running")
            return

        self.state.running = True
        self.state.started_at = datetime.now().isoformat()

        logger.info("=== RCM Scheduler Starting ===")
        logger.info(f"Graph refresh: every {self._graph_interval // 60} min")
        logger.info(f"Simulation run: every {self._sim_interval // 60} min")
        logger.info(f"Report generation: every {self._report_interval // 3600} hours")
        logger.info(f"Scenarios loaded: {len(self._scenarios)}")

        # Launch background tasks
        self._graph_task = asyncio.create_task(self._graph_refresh_loop())
        self._sim_task = asyncio.create_task(self._simulation_loop())
        self._report_task = asyncio.create_task(self._report_loop())

        # Run initial graph build + simulation immediately
        asyncio.create_task(self._initial_run())

    async def stop(self):
        """Stop all background loops"""
        logger.info("=== RCM Scheduler Stopping ===")
        self.state.running = False

        for task in [self._graph_task, self._sim_task, self._report_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        logger.info("Scheduler stopped")

    async def _initial_run(self):
        """Run initial graph build and simulation on startup"""
        try:
            logger.info("Running initial graph build...")
            await self._refresh_graph()

            logger.info("Running initial simulation pass...")
            await self._run_all_simulations()

            logger.info("Initial run complete")
        except Exception as e:
            logger.error(f"Initial run failed: {e}")
            self.state.errors.append(f"Initial run: {str(e)}")

    async def _graph_refresh_loop(self):
        """Periodically refresh the RCM knowledge graph"""
        while self.state.running:
            try:
                await asyncio.sleep(self._graph_interval)
                if not self.state.running:
                    break
                await self._refresh_graph()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Graph refresh loop error: {e}")
                self.state.errors.append(f"Graph refresh: {str(e)}")
                await asyncio.sleep(60)  # Back off on error

    async def _simulation_loop(self):
        """Periodically run all simulation scenarios"""
        while self.state.running:
            try:
                await asyncio.sleep(self._sim_interval)
                if not self.state.running:
                    break
                await self._run_all_simulations()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulation loop error: {e}")
                self.state.errors.append(f"Simulation: {str(e)}")
                await asyncio.sleep(60)

    async def _report_loop(self):
        """Generate daily comprehensive report"""
        while self.state.running:
            try:
                await asyncio.sleep(self._report_interval)
                if not self.state.running:
                    break
                await self._generate_report()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Report loop error: {e}")
                self.state.errors.append(f"Report: {str(e)}")
                await asyncio.sleep(300)

    async def _refresh_graph(self):
        """Execute graph refresh"""
        try:
            from .rcm_graph_builder import get_graph_builder
            builder = await get_graph_builder()
            result = await builder.build_rcm_graph()

            self.state.last_graph_refresh = datetime.now().isoformat()
            self.state.graph_refresh_count += 1

            logger.info(f"Graph refreshed: {result.get('episodes_ingested', 0)} episodes ({self.state.graph_refresh_count} total refreshes)")
        except Exception as e:
            logger.error(f"Graph refresh failed: {e}")
            self.state.errors.append(f"Graph refresh failed: {str(e)}")

    async def _run_all_simulations(self):
        """Run all simulation scenarios"""
        try:
            from .rcm_simulation import get_simulation_engine
            engine = await get_simulation_engine()

            results = {}
            for scenario in self._scenarios:
                try:
                    sid = scenario.get('scenario_id', 'unknown')
                    logger.info(f"Running scenario: {scenario.get('name', sid)}")

                    result = await engine.run_simulation(scenario)
                    results[sid] = result.to_dict()

                    logger.info(f"Scenario {sid} complete: {result.status.value} in {result.elapsed_seconds:.1f}s")
                except Exception as e:
                    logger.error(f"Scenario {scenario.get('scenario_id', '?')} failed: {e}")
                    results[scenario.get('scenario_id', 'error')] = {"error": str(e)}

            self.state.latest_results = results
            self.state.last_simulation_run = datetime.now().isoformat()
            self.state.simulation_run_count += 1

            logger.info(f"All {len(results)} scenarios complete ({self.state.simulation_run_count} total runs)")
        except Exception as e:
            logger.error(f"Simulation run failed: {e}")
            self.state.errors.append(f"Simulation run failed: {str(e)}")

    async def _generate_report(self):
        """Generate comprehensive daily report"""
        try:
            from .rcm_simulation import get_simulation_engine
            engine = await get_simulation_engine()

            # Synthesize all latest results into a report
            report_scenario = {
                "name": "Daily Comprehensive Report",
                "type": "report",
                "simulation_type": "claim_submission",
                "latest_results": self.state.latest_results
            }

            result = await engine.run_simulation(report_scenario, num_rounds=2)

            self.state.last_report_generated = datetime.now().isoformat()
            self.state.report_count += 1

            logger.info(f"Daily report generated ({self.state.report_count} total)")
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            self.state.errors.append(f"Report: {str(e)}")

    def get_latest_results(self) -> Dict[str, Any]:
        """Get all cached simulation results"""
        return {
            "scheduler_state": self.state.to_dict(),
            "results": self.state.latest_results
        }

    def get_scenario_result(self, scenario_id: str) -> Optional[Dict]:
        """Get cached result for a specific scenario"""
        return self.state.latest_results.get(scenario_id)

    async def run_scenario_now(self, scenario_id: str) -> Dict:
        """Run a specific scenario immediately (on-demand)"""
        scenario = next((s for s in self._scenarios if s.get('scenario_id') == scenario_id), None)
        if not scenario:
            return {"error": f"Scenario {scenario_id} not found"}

        from .rcm_simulation import get_simulation_engine
        engine = await get_simulation_engine()
        result = await engine.run_simulation(scenario)

        # Update cache
        self.state.latest_results[scenario_id] = result.to_dict()

        return result.to_dict()


# Singleton
_scheduler: Optional[RCMScheduler] = None

def get_scheduler() -> RCMScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = RCMScheduler()
    return _scheduler
