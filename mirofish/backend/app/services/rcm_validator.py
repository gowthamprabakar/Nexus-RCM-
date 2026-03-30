"""
RCM Validation Layer

Every suggestion, automation proposal, and recommended action from NEXUS RCM
is validated by MiroFish agents BEFORE being shown to users.

Validation types:
1. Appeal validation - would this appeal succeed?
2. Automation validation - would this automation rule work?
3. Correction validation - is this coding correction valid?
4. Compliance check - does this violate any rules?
5. Root cause validation - is this root cause classification correct?
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient

logger = get_logger('mirofish.rcm_validator')


class ValidationType(str, Enum):
    APPEAL = "appeal"
    AUTOMATION = "automation"
    CORRECTION = "correction"
    COMPLIANCE = "compliance"
    ROOT_CAUSE = "root_cause"


class ValidationVerdict(str, Enum):
    APPROVED = "approved"      # Safe to show to user
    NEEDS_REVIEW = "needs_review"  # Show with warnings
    REJECTED = "rejected"      # Don't show to user


@dataclass
class ValidationResult:
    validation_id: str
    validation_type: ValidationType
    verdict: ValidationVerdict
    confidence: float
    reasoning: str
    agent_validations: List[Dict[str, Any]]
    risk_factors: List[str]
    modifications_suggested: List[str]
    original_suggestion: Dict[str, Any]
    validated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "validation_id": self.validation_id,
            "validation_type": self.validation_type.value,
            "verdict": self.verdict.value,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "agent_validations": self.agent_validations,
            "risk_factors": self.risk_factors,
            "modifications_suggested": self.modifications_suggested,
            "validated_at": self.validated_at
        }


class RCMValidator:
    """Validates RCM suggestions using payer digital twin agents"""

    def __init__(self, llm_client: LLMClient = None):
        self.llm_client = llm_client or LLMClient()
        self._agent_generator = None
        self._cache: Dict[str, ValidationResult] = {}
        self.CACHE_TTL_SECONDS = 1800  # 30 minutes

    async def _get_agents(self):
        if self._agent_generator is None:
            from .rcm_agent_generator import get_agent_generator
            self._agent_generator = await get_agent_generator()
        return self._agent_generator

    async def validate(self, suggestion: Dict[str, Any], validation_type: str = None) -> ValidationResult:
        """Main validation entry point - routes to appropriate validator"""
        import uuid
        vid = str(uuid.uuid4())[:8]

        # Check cache
        cache_key = json.dumps(suggestion, sort_keys=True, default=str)[:200]
        if cache_key in self._cache:
            cached = self._cache[cache_key]
            age = (datetime.now() - datetime.fromisoformat(cached.validated_at)).total_seconds()
            if age < self.CACHE_TTL_SECONDS:
                logger.info(f"Returning cached validation for {cache_key[:50]}...")
                return cached

        # Detect validation type
        vtype = self._detect_type(suggestion, validation_type)

        # Run validation based on type
        if vtype == ValidationType.APPEAL:
            result = await self._validate_appeal(vid, suggestion)
        elif vtype == ValidationType.AUTOMATION:
            result = await self._validate_automation(vid, suggestion)
        elif vtype == ValidationType.CORRECTION:
            result = await self._validate_correction(vid, suggestion)
        elif vtype == ValidationType.COMPLIANCE:
            result = await self._validate_compliance(vid, suggestion)
        elif vtype == ValidationType.ROOT_CAUSE:
            result = await self._validate_root_cause(vid, suggestion)
        else:
            result = await self._validate_general(vid, suggestion)

        # Cache result
        self._cache[cache_key] = result

        # Store in Graphiti memory
        await self._store_validation_memory(result)

        return result

    async def _validate_appeal(self, vid: str, suggestion: Dict) -> ValidationResult:
        """Validate appeal strategy with payer agents"""
        agents = await self._get_agents()

        payer_name = suggestion.get('payer', suggestion.get('payer_name', ''))

        # Ask the specific payer agent if this appeal would work
        prompt = f"""As the payer, evaluate this appeal:

APPEAL DETAILS:
{json.dumps(suggestion, indent=2, default=str)[:1000]}

Would you reverse the denial based on this appeal? Consider:
1. Is the appeal reason valid for your denial patterns?
2. Does the supporting documentation justify reversal?
3. What is your historical reversal rate for this type?

Respond with JSON:
{{
    "would_reverse": true/false,
    "reversal_probability": 0.0-1.0,
    "reasoning": "explanation",
    "weaknesses": ["list of appeal weaknesses"],
    "improvements": ["suggested improvements to strengthen appeal"]
}}"""

        validations = []
        all_agents = agents.get_all_agents()

        # If specific payer, ask that one first
        relevant = [a for a in all_agents if payer_name.lower() in a.name.lower()]
        if not relevant:
            relevant = all_agents[:3]

        for agent in relevant[:3]:
            try:
                result = self.llm_client.chat_json([
                    {"role": "system", "content": agent.to_system_prompt()},
                    {"role": "user", "content": prompt}
                ], temperature=0.3, max_tokens=600)

                validations.append({
                    "agent": agent.name,
                    "would_reverse": result.get("would_reverse", False),
                    "probability": result.get("reversal_probability", 0.5),
                    "reasoning": result.get("reasoning", ""),
                    "weaknesses": result.get("weaknesses", []),
                    "improvements": result.get("improvements", [])
                })
            except Exception as e:
                logger.error(f"Appeal validation by {agent.name} failed: {e}")

        # Determine verdict
        if validations:
            avg_prob = sum(v["probability"] for v in validations) / len(validations)
            would_reverse = sum(1 for v in validations if v["would_reverse"]) / len(validations)
        else:
            avg_prob = 0.5
            would_reverse = 0.5

        if avg_prob >= 0.6:
            verdict = ValidationVerdict.APPROVED
        elif avg_prob >= 0.3:
            verdict = ValidationVerdict.NEEDS_REVIEW
        else:
            verdict = ValidationVerdict.REJECTED

        all_weaknesses = []
        all_improvements = []
        for v in validations:
            all_weaknesses.extend(v.get("weaknesses", []))
            all_improvements.extend(v.get("improvements", []))

        return ValidationResult(
            validation_id=vid,
            validation_type=ValidationType.APPEAL,
            verdict=verdict,
            confidence=avg_prob,
            reasoning=f"{len(validations)} payer agents evaluated. Reversal consensus: {would_reverse:.0%}. Avg probability: {avg_prob:.0%}.",
            agent_validations=validations,
            risk_factors=list(set(all_weaknesses)),
            modifications_suggested=list(set(all_improvements)),
            original_suggestion=suggestion
        )

    async def _validate_automation(self, vid: str, suggestion: Dict) -> ValidationResult:
        """Validate automation rule effectiveness"""
        agents = await self._get_agents()
        validation = await agents.validate_suggestion(suggestion)

        confidence = validation.get("confidence", 0.5)
        if confidence >= 0.6:
            verdict = ValidationVerdict.APPROVED
        elif confidence >= 0.3:
            verdict = ValidationVerdict.NEEDS_REVIEW
        else:
            verdict = ValidationVerdict.REJECTED

        return ValidationResult(
            validation_id=vid,
            validation_type=ValidationType.AUTOMATION,
            verdict=verdict,
            confidence=confidence,
            reasoning=f"Consensus: {validation.get('consensus', 0):.0%}. Recommendation: {validation.get('recommendation', 'REVIEW')}.",
            agent_validations=validation.get("validations", []),
            risk_factors=validation.get("all_issues", []),
            modifications_suggested=validation.get("all_modifications", []),
            original_suggestion=suggestion
        )

    async def _validate_correction(self, vid: str, suggestion: Dict) -> ValidationResult:
        """Validate coding correction"""
        prompt = f"""Evaluate this coding correction for a healthcare claim:

CORRECTION:
{json.dumps(suggestion, indent=2, default=str)[:800]}

Check:
1. Is the corrected code valid and appropriate?
2. Would this correction resolve the denial?
3. Are there compliance risks with this change?
4. Is there a better correction?

Respond with JSON:
{{
    "is_valid": true/false,
    "confidence": 0.0-1.0,
    "reasoning": "explanation",
    "compliance_risks": ["list"],
    "better_alternatives": ["list"]
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": "You are an expert medical coding compliance specialist. Validate coding corrections with precision."},
                {"role": "user", "content": prompt}
            ], temperature=0.2, max_tokens=600)

            is_valid = result.get("is_valid", False)
            confidence = result.get("confidence", 0.5)

            if is_valid and confidence >= 0.7:
                verdict = ValidationVerdict.APPROVED
            elif is_valid:
                verdict = ValidationVerdict.NEEDS_REVIEW
            else:
                verdict = ValidationVerdict.REJECTED

            return ValidationResult(
                validation_id=vid,
                validation_type=ValidationType.CORRECTION,
                verdict=verdict,
                confidence=confidence,
                reasoning=result.get("reasoning", ""),
                agent_validations=[{"agent": "coding_specialist", "result": result}],
                risk_factors=result.get("compliance_risks", []),
                modifications_suggested=result.get("better_alternatives", []),
                original_suggestion=suggestion
            )
        except Exception as e:
            return self._fallback_result(vid, ValidationType.CORRECTION, suggestion, str(e))

    async def _validate_compliance(self, vid: str, suggestion: Dict) -> ValidationResult:
        """Check for regulatory compliance issues"""
        prompt = f"""Check this RCM action for regulatory compliance:

ACTION:
{json.dumps(suggestion, indent=2, default=str)[:800]}

Check against:
1. HIPAA requirements
2. CMS billing guidelines
3. State-specific regulations
4. Anti-fraud provisions
5. Timely filing requirements

Respond with JSON:
{{
    "compliant": true/false,
    "confidence": 0.0-1.0,
    "violations_found": ["list of violations"],
    "warnings": ["list of warnings"],
    "reasoning": "explanation"
}}"""

        try:
            result = self.llm_client.chat_json([
                {"role": "system", "content": "You are a healthcare compliance officer. Check for regulatory violations."},
                {"role": "user", "content": prompt}
            ], temperature=0.2, max_tokens=600)

            compliant = result.get("compliant", True)
            confidence = result.get("confidence", 0.5)

            if compliant and confidence >= 0.7:
                verdict = ValidationVerdict.APPROVED
            elif compliant:
                verdict = ValidationVerdict.NEEDS_REVIEW
            else:
                verdict = ValidationVerdict.REJECTED

            return ValidationResult(
                validation_id=vid,
                validation_type=ValidationType.COMPLIANCE,
                verdict=verdict,
                confidence=confidence,
                reasoning=result.get("reasoning", ""),
                agent_validations=[{"agent": "compliance_officer", "result": result}],
                risk_factors=result.get("violations_found", []) + result.get("warnings", []),
                modifications_suggested=[],
                original_suggestion=suggestion
            )
        except Exception as e:
            return self._fallback_result(vid, ValidationType.COMPLIANCE, suggestion, str(e))

    async def _validate_root_cause(self, vid: str, suggestion: Dict) -> ValidationResult:
        """Validate root cause classification"""
        agents = await self._get_agents()

        prompt = f"""Evaluate this root cause classification:

DENIAL:
{json.dumps(suggestion, indent=2, default=str)[:800]}

As a payer agent, do you agree with the identified root cause? Consider:
1. Does the root cause match your typical denial patterns?
2. Is there a more likely root cause based on your experience?
3. Would you reverse on appeal if they addressed this root cause?

Respond with JSON:
{{
    "agree_with_classification": true/false,
    "confidence": 0.0-1.0,
    "alternative_root_cause": "name or null",
    "reasoning": "explanation",
    "would_reverse_if_fixed": true/false
}}"""

        validations = []
        for agent in agents.get_all_agents()[:3]:
            try:
                result = self.llm_client.chat_json([
                    {"role": "system", "content": agent.to_system_prompt()},
                    {"role": "user", "content": prompt}
                ], temperature=0.3, max_tokens=500)
                validations.append({"agent": agent.name, **result})
            except Exception as e:
                logger.error(f"Root cause validation by {agent.name} failed: {e}")

        if validations:
            agreement = sum(1 for v in validations if v.get("agree_with_classification", False)) / len(validations)
            avg_conf = sum(v.get("confidence", 0.5) for v in validations) / len(validations)
        else:
            agreement = 0.5
            avg_conf = 0.5

        if agreement >= 0.6:
            verdict = ValidationVerdict.APPROVED
        elif agreement >= 0.3:
            verdict = ValidationVerdict.NEEDS_REVIEW
        else:
            verdict = ValidationVerdict.REJECTED

        alternatives = [v.get("alternative_root_cause") for v in validations if v.get("alternative_root_cause")]

        return ValidationResult(
            validation_id=vid,
            validation_type=ValidationType.ROOT_CAUSE,
            verdict=verdict,
            confidence=avg_conf,
            reasoning=f"Agent agreement: {agreement:.0%}. {len(alternatives)} alternatives suggested.",
            agent_validations=validations,
            risk_factors=alternatives,
            modifications_suggested=[],
            original_suggestion=suggestion
        )

    async def _validate_general(self, vid: str, suggestion: Dict) -> ValidationResult:
        """General validation fallback"""
        agents = await self._get_agents()
        validation = await agents.validate_suggestion(suggestion)

        confidence = validation.get("confidence", 0.5)
        verdict = ValidationVerdict.APPROVED if confidence >= 0.6 else (
            ValidationVerdict.NEEDS_REVIEW if confidence >= 0.3 else ValidationVerdict.REJECTED
        )

        return ValidationResult(
            validation_id=vid,
            validation_type=ValidationType.AUTOMATION,
            verdict=verdict,
            confidence=confidence,
            reasoning=validation.get("recommendation", ""),
            agent_validations=validation.get("validations", []),
            risk_factors=validation.get("all_issues", []),
            modifications_suggested=validation.get("all_modifications", []),
            original_suggestion=suggestion
        )

    def _detect_type(self, suggestion: Dict, explicit_type: str = None) -> ValidationType:
        if explicit_type:
            try:
                return ValidationType(explicit_type)
            except ValueError:
                pass

        text = json.dumps(suggestion).lower()
        if 'appeal' in text:
            return ValidationType.APPEAL
        elif 'automation' in text or 'auto_' in text or 'rule' in text:
            return ValidationType.AUTOMATION
        elif 'correction' in text or 'coding' in text or 'cpt' in text:
            return ValidationType.CORRECTION
        elif 'root_cause' in text or 'root cause' in text:
            return ValidationType.ROOT_CAUSE
        elif 'compliance' in text or 'hipaa' in text:
            return ValidationType.COMPLIANCE
        else:
            return ValidationType.AUTOMATION

    def _fallback_result(self, vid: str, vtype: ValidationType, suggestion: Dict, error: str) -> ValidationResult:
        return ValidationResult(
            validation_id=vid,
            validation_type=vtype,
            verdict=ValidationVerdict.NEEDS_REVIEW,
            confidence=0.5,
            reasoning=f"Validation failed: {error}. Manual review required.",
            agent_validations=[],
            risk_factors=["validation_failure"],
            modifications_suggested=["Manual review recommended"],
            original_suggestion=suggestion
        )

    async def _store_validation_memory(self, result: ValidationResult):
        """Store validation outcome in Graphiti for learning"""
        try:
            from .rcm_graph_builder import get_graph_builder
            from graphiti_core.nodes import EpisodeType
            builder = await get_graph_builder()

            episode = (
                f"Validation {result.validation_id}: {result.validation_type.value} "
                f"verdict={result.verdict.value} confidence={result.confidence:.0%}. "
                f"{result.reasoning[:200]}"
            )

            await builder.graphiti.add_episode(
                name=f"validation_{result.validation_id}",
                episode_body=episode,
                source=EpisodeType.text,
                source_description="RCM Validation Layer",
                reference_time=datetime.now()
            )
        except Exception as e:
            logger.debug(f"Failed to store validation memory: {e}")


# Singleton
_validator: Optional[RCMValidator] = None

async def get_validator() -> RCMValidator:
    global _validator
    if _validator is None:
        _validator = RCMValidator()
    return _validator
