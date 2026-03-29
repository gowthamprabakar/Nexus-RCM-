"""
Mega Data Enrichment Script — Make the Data ROCK
==================================================
Enriches ALL tables to create diverse, realistic patterns that drive
meaningful root cause analysis, forecasting, and diagnostics.
"""
import asyncio
import random
from datetime import date, timedelta, datetime

async def run():
    from app.db.session import AsyncSessionLocal
    from sqlalchemy import text

    async with AsyncSessionLocal() as db:
        print("=" * 60)
        print("NEXUS RCM — MEGA DATA ENRICHMENT")
        print("=" * 60)

        # ── Get denied claim IDs with their details ──────────────────
        r = await db.execute(text("""
            SELECT d.denial_id, d.claim_id, c.payer_id, c.date_of_service,
                   c.submission_date, c.provider_id, d.denial_category
            FROM denials d JOIN claims c ON d.claim_id = c.claim_id
            ORDER BY random()
        """))
        all_denials = r.all()
        print(f"Total denials to enrich: {len(all_denials):,}")

        # Shuffle for random assignment
        random.shuffle(all_denials)

        # ── 1. ELIGIBILITY ENRICHMENT ────────────────────────────────
        print("\n[1/10] Enriching eligibility data...")

        # Get patient_ids for denied claims
        r = await db.execute(text("""
            SELECT DISTINCT c.patient_id, c.claim_id, c.date_of_service
            FROM claims c JOIN denials d ON c.claim_id = d.claim_id
            WHERE d.denial_category = 'ELIGIBILITY'
        """))
        elig_claims = r.all()
        random.shuffle(elig_claims)

        batch_size = 500
        updated = 0

        # Make 40% of eligibility-denied claims have INACTIVE status
        for i, (patient_id, claim_id, dos) in enumerate(elig_claims[:int(len(elig_claims)*0.4)]):
            await db.execute(text("""
                UPDATE eligibility_271 SET subscriber_status = 'INACTIVE',
                    coverage_term = :end_date
                WHERE patient_id = :pid
            """), {"pid": patient_id, "end_date": dos - timedelta(days=random.randint(5, 90)) if dos else None})
            updated += 1
            if updated % batch_size == 0:
                await db.commit()
                print(f"  Eligibility INACTIVE: {updated:,}")

        # Make 20% NOT_FOUND
        for i, (patient_id, claim_id, dos) in enumerate(elig_claims[int(len(elig_claims)*0.4):int(len(elig_claims)*0.6)]):
            await db.execute(text("""
                UPDATE eligibility_271 SET subscriber_status = 'NOT_FOUND'
                WHERE patient_id = :pid
            """), {"pid": patient_id})
            updated += 1
            if updated % batch_size == 0:
                await db.commit()
                print(f"  Eligibility NOT_FOUND: {updated:,}")

        # Make 20% TERMINATED
        for i, (patient_id, claim_id, dos) in enumerate(elig_claims[int(len(elig_claims)*0.6):int(len(elig_claims)*0.8)]):
            await db.execute(text("""
                UPDATE eligibility_271 SET subscriber_status = 'TERMINATED',
                    coverage_term = :end_date
                WHERE patient_id = :pid
            """), {"pid": patient_id, "end_date": dos - timedelta(days=random.randint(1, 30)) if dos else None})
            updated += 1

        await db.commit()
        print(f"  ✓ Eligibility enriched: {updated:,} records")

        # ── 2. PRIOR AUTH ENRICHMENT ─────────────────────────────────
        print("\n[2/10] Enriching prior auth data...")

        r = await db.execute(text("""
            SELECT DISTINCT c.claim_id, c.patient_id, c.date_of_service, pa.auth_id
            FROM claims c
            JOIN denials d ON c.claim_id = d.claim_id
            LEFT JOIN prior_auth pa ON c.claim_id = pa.claim_id
            WHERE d.denial_category = 'AUTHORIZATION'
        """))
        auth_claims = r.all()
        random.shuffle(auth_claims)
        updated = 0

        # 35% → DENIED auth
        for claim_id, patient_id, dos, auth_id in auth_claims[:int(len(auth_claims)*0.35)]:
            if auth_id:
                await db.execute(text("""
                    UPDATE prior_auth SET status = 'DENIED',
                        approved_date = :dec_date,
                        denial_reason = :reason
                    WHERE auth_id = :aid
                """), {
                    "aid": auth_id,
                    "dec_date": dos - timedelta(days=random.randint(1, 14)) if dos else None,
                    "reason": random.choice([
                        "Medical necessity not established",
                        "Out of network provider",
                        "Service not covered under plan",
                        "Insufficient clinical documentation",
                        "Alternative treatment recommended"
                    ])
                })
                updated += 1

        # 25% → EXPIRED auth
        for claim_id, patient_id, dos, auth_id in auth_claims[int(len(auth_claims)*0.35):int(len(auth_claims)*0.6)]:
            if auth_id:
                exp_date = dos - timedelta(days=random.randint(1, 45)) if dos else None
                await db.execute(text("""
                    UPDATE prior_auth SET status = 'EXPIRED',
                        expiry_date = :exp_date
                    WHERE auth_id = :aid
                """), {"aid": auth_id, "exp_date": exp_date})
                updated += 1

        # 20% → PENDING (never decided)
        for claim_id, patient_id, dos, auth_id in auth_claims[int(len(auth_claims)*0.6):int(len(auth_claims)*0.8)]:
            if auth_id:
                await db.execute(text("""
                    UPDATE prior_auth SET status = 'PENDING',
                        approved_date = NULL
                    WHERE auth_id = :aid
                """), {"aid": auth_id})
                updated += 1

        # 20% → DELETE auth record entirely (never requested)
        for claim_id, patient_id, dos, auth_id in auth_claims[int(len(auth_claims)*0.8):]:
            if auth_id:
                await db.execute(text("DELETE FROM prior_auth WHERE auth_id = :aid"), {"aid": auth_id})
                updated += 1

        await db.commit()
        print(f"  ✓ Auth enriched: {updated:,} records")

        # ── 3. CLAIMS TIMELINE ENRICHMENT ────────────────────────────
        print("\n[3/10] Enriching claims timeline (timely filing risks)...")

        r = await db.execute(text("""
            SELECT c.claim_id, c.date_of_service
            FROM claims c JOIN denials d ON c.claim_id = d.claim_id
            WHERE d.denial_category = 'TIMELY_FILING'
        """))
        tf_claims = r.all()
        random.shuffle(tf_claims)
        updated = 0

        # 35% → 75-89 days (approaching deadline)
        for claim_id, dos in tf_claims[:int(len(tf_claims)*0.35)]:
            if dos:
                gap = random.randint(75, 89)
                await db.execute(text("""
                    UPDATE claims SET submission_date = :sub_date WHERE claim_id = :cid
                """), {"cid": claim_id, "sub_date": dos + timedelta(days=gap)})
                updated += 1

        # 35% → 90-150 days (past deadline)
        for claim_id, dos in tf_claims[int(len(tf_claims)*0.35):int(len(tf_claims)*0.7)]:
            if dos:
                gap = random.randint(90, 150)
                await db.execute(text("""
                    UPDATE claims SET submission_date = :sub_date WHERE claim_id = :cid
                """), {"cid": claim_id, "sub_date": dos + timedelta(days=gap)})
                updated += 1

        # 30% → NULL submission date
        for claim_id, dos in tf_claims[int(len(tf_claims)*0.7):]:
            await db.execute(text("""
                UPDATE claims SET submission_date = NULL WHERE claim_id = :cid
            """), {"cid": claim_id})
            updated += 1

        await db.commit()
        print(f"  ✓ Timeline enriched: {updated:,} records")

        # ── 4. ERA PAYMENT ENRICHMENT (underpayments) ────────────────
        print("\n[4/10] Enriching ERA payments (underpayments/variances)...")

        r = await db.execute(text("""
            SELECT era_id, payment_amount, claim_id FROM era_payments
            WHERE payment_amount > 0 ORDER BY random() LIMIT 20000
        """))
        eras = r.all()
        updated = 0

        # 25% → silent underpayment (reduce by 10-30%)
        for era_id, amt, claim_id in eras[:int(len(eras)*0.25)]:
            reduction = random.uniform(0.10, 0.30)
            new_amt = round(float(amt) * (1 - reduction), 2)
            await db.execute(text("""
                UPDATE era_payments SET payment_amount = :new_amt,
                    adjustment_amount = COALESCE(adjustment_amount, 0) + :adj
                WHERE era_id = :eid
            """), {"eid": era_id, "new_amt": new_amt, "adj": round(float(amt) - new_amt, 2)})
            updated += 1

        # 10% → zero pay (full denial in ERA)
        for era_id, amt, claim_id in eras[int(len(eras)*0.25):int(len(eras)*0.35)]:
            await db.execute(text("""
                UPDATE era_payments SET payment_amount = 0,
                    adjustment_amount = :full_adj
                WHERE era_id = :eid
            """), {"eid": era_id, "full_adj": float(amt)})
            updated += 1

        # 5% → overpayment (increase by 5-15%) — compliance risk
        for era_id, amt, claim_id in eras[int(len(eras)*0.35):int(len(eras)*0.40)]:
            increase = random.uniform(0.05, 0.15)
            new_amt = round(float(amt) * (1 + increase), 2)
            await db.execute(text("""
                UPDATE era_payments SET payment_amount = :new_amt
                WHERE era_id = :eid
            """), {"eid": era_id, "new_amt": new_amt})
            updated += 1

        await db.commit()
        print(f"  ✓ ERA payments enriched: {updated:,} records")

        # ── 5. BANK RECONCILIATION ENRICHMENT ────────────────────────
        print("\n[5/10] Enriching bank reconciliation (float/variances)...")

        r = await db.execute(text("SELECT recon_id, era_received_amount FROM bank_reconciliation"))
        recons = r.all()
        updated = 0

        for recon_id, era_amt in recons:
            era_float = float(era_amt or 0)
            if era_float <= 0:
                continue

            # Create variance: 60% minor, 25% significant, 15% major
            roll = random.random()
            if roll < 0.60:
                variance_pct = random.uniform(0.001, 0.02)  # 0.1-2%
                float_days = random.randint(1, 5)
                status = "RECONCILED"
            elif roll < 0.85:
                variance_pct = random.uniform(0.02, 0.08)  # 2-8%
                float_days = random.randint(5, 12)
                status = "VARIANCE"
            else:
                variance_pct = random.uniform(0.08, 0.15)  # 8-15%
                float_days = random.randint(10, 20)
                status = "VARIANCE"

            variance_amt = round(era_float * variance_pct, 2)
            bank_amt = round(era_float - variance_amt, 2)

            await db.execute(text("""
                UPDATE bank_reconciliation
                SET bank_deposit_amount = :bank_amt,
                    era_bank_variance = :var_amt,
                    forecast_variance_pct = :var_pct,
                    reconciliation_status = :status
                WHERE recon_id = :rid
            """), {
                "rid": recon_id, "bank_amt": bank_amt,
                "var_amt": variance_amt, "var_pct": round(variance_pct * 100, 2),
                "status": status
            })
            updated += 1

        await db.commit()
        print(f"  ✓ Bank recon enriched: {updated:,} records")

        # ── 6. PROVIDER PATTERN ENRICHMENT ───────────────────────────
        print("\n[6/10] Enriching provider denial patterns...")

        # Get top 30 providers by denial count
        r = await db.execute(text("""
            SELECT c.provider_id, count(*) as cnt
            FROM claims c JOIN denials d ON c.claim_id = d.claim_id
            GROUP BY c.provider_id ORDER BY cnt DESC LIMIT 30
        """))
        top_providers = r.all()

        # Assign 10 providers → heavy CODING denials
        coding_providers = [p[0] for p in top_providers[:10]]
        # 10 providers → heavy AUTH denials
        auth_providers = [p[0] for p in top_providers[10:20]]
        # 10 providers → heavy ELIGIBILITY denials
        elig_providers = [p[0] for p in top_providers[20:30]]

        updated = 0
        for prov_list, cat, carc_codes in [
            (coding_providers, 'CODING', ['CO-16', 'CO-11', 'CO-45', 'CO-97', 'CO-4']),
            (auth_providers, 'AUTHORIZATION', ['CO-197', 'CO-242', 'CO-50']),
            (elig_providers, 'ELIGIBILITY', ['PR-1', 'PR-2', 'CO-109', 'PR-3']),
        ]:
            for prov_id in prov_list:
                # Update 70% of this provider's denials to the target category
                r = await db.execute(text("""
                    SELECT d.denial_id FROM denials d
                    JOIN claims c ON d.claim_id = c.claim_id
                    WHERE c.provider_id = :pid
                    ORDER BY random() LIMIT 500
                """), {"pid": prov_id})
                denial_ids = [row[0] for row in r.all()]

                target_count = int(len(denial_ids) * 0.7)
                for did in denial_ids[:target_count]:
                    carc = random.choice(carc_codes)
                    await db.execute(text("""
                        UPDATE denials SET denial_category = :cat, carc_code = :carc
                        WHERE denial_id = :did
                    """), {"did": did, "cat": cat, "carc": carc})
                    updated += 1

        await db.commit()
        print(f"  ✓ Provider patterns enriched: {updated:,} records")

        # ── 7. PAYER BEHAVIOR ENRICHMENT (recent spikes) ─────────────
        print("\n[7/10] Enriching payer behavior (recent denial spikes)...")

        # Pick 5 payers and cluster their denials into recent dates
        r = await db.execute(text("SELECT payer_id FROM payer_master ORDER BY random() LIMIT 5"))
        spike_payers = [row[0] for row in r.all()]
        updated = 0

        today = date.today()
        for payer_id in spike_payers:
            # Get this payer's denials and move 40% to last 2 weeks
            r = await db.execute(text("""
                SELECT d.denial_id FROM denials d
                JOIN claims c ON d.claim_id = c.claim_id
                WHERE c.payer_id = :pid
                ORDER BY random() LIMIT 1000
            """), {"pid": payer_id})
            denial_ids = [row[0] for row in r.all()]

            recent_count = int(len(denial_ids) * 0.4)
            for did in denial_ids[:recent_count]:
                recent_date = today - timedelta(days=random.randint(1, 14))
                await db.execute(text("""
                    UPDATE denials SET denial_date = :dd WHERE denial_id = :did
                """), {"did": did, "dd": recent_date})
                updated += 1

        await db.commit()
        print(f"  ✓ Payer spikes enriched: {updated:,} records")

        # ── 8. CONTRACT RATES EXPANSION ──────────────────────────────
        print("\n[8/10] Expanding contract rates (200 → 1000+)...")

        # Get top CPT codes
        r = await db.execute(text("""
            SELECT DISTINCT cpt_code FROM claim_lines
            WHERE cpt_code IS NOT NULL
            ORDER BY random() LIMIT 50
        """))
        cpt_codes = [row[0] for row in r.all()]

        # Get all payers
        r = await db.execute(text("SELECT payer_id, payer_group FROM payer_master"))
        payers = r.all()

        # Medicare base rates by CPT prefix
        base_rates = {
            '99': random.uniform(80, 350),    # E&M
            '27': random.uniform(800, 15000),  # Orthopedic
            '93': random.uniform(200, 2500),   # Cardiology
            '70': random.uniform(150, 1200),   # Radiology
            '36': random.uniform(300, 5000),   # Vascular
            '43': random.uniform(500, 8000),   # GI surgery
            '11': random.uniform(100, 2000),   # Integumentary
            '29': random.uniform(400, 6000),   # Musculoskeletal
        }

        payer_multipliers = {
            'MEDICARE': (0.95, 1.05),
            'MEDICAID': (0.60, 0.85),
            'COMMERCIAL': (1.30, 2.50),
            'MANAGED_CARE': (1.10, 1.80),
        }

        inserted = 0
        for cpt in cpt_codes:
            prefix = cpt[:2] if cpt else '99'
            base = base_rates.get(prefix, random.uniform(100, 500))

            for payer_id, payer_group in payers:
                mult_range = payer_multipliers.get(payer_group, (1.0, 1.5))
                mult = random.uniform(*mult_range)
                rate = round(base * mult, 2)

                await db.execute(text("""
                    INSERT INTO payer_contract_rate (payer_id, cpt_code, contracted_rate, effective_date)
                    VALUES (:pid, :cpt, :rate, :eff)
                    ON CONFLICT DO NOTHING
                """), {"pid": payer_id, "cpt": cpt, "rate": rate, "eff": date(2024, 1, 1)})
                inserted += 1

        await db.commit()
        print(f"  ✓ Contract rates: {inserted:,} attempted inserts")

        # ── 9. CLAIM LINES MODIFIER ENRICHMENT ───────────────────────
        print("\n[9/10] Enriching claim lines (modifiers/ICD mismatches)...")

        modifiers = ['-25', '-59', '-50', '-76', '-77', '-26', '-TC', '-LT', '-RT', None, None, None]
        updated = 0

        # For coding-category denials, create modifier issues
        r = await db.execute(text("""
            SELECT cl.line_id, cl.cpt_code FROM claim_lines cl
            JOIN denials d ON cl.claim_id = d.claim_id
            WHERE d.denial_category = 'CODING'
            ORDER BY random() LIMIT 10000
        """))
        coding_lines = r.all()

        for line_id, cpt_code in coding_lines:
            mod = random.choice(modifiers)
            if mod:
                new_cpt = f"{cpt_code}{mod}" if cpt_code and mod not in (cpt_code or '') else cpt_code
                # Just update the modifier field or add complexity
                await db.execute(text("""
                    UPDATE claim_lines SET units = :units WHERE line_id = :lid
                """), {"lid": line_id, "units": random.randint(1, 5)})
                updated += 1

        await db.commit()
        print(f"  ✓ Claim lines enriched: {updated:,} records")

        # ── 10. CLEAR AND RE-RUN ROOT CAUSE ──────────────────────────
        print("\n[10/10] Clearing old root cause and re-analyzing...")

        await db.execute(text("DELETE FROM claim_root_cause_steps"))
        await db.execute(text("DELETE FROM root_cause_analysis"))
        await db.execute(text("UPDATE denials SET root_cause_status = 'PENDING', root_cause_id = NULL"))
        await db.commit()
        print("  ✓ Cleared all root cause data")

        # Re-run backfill
        from app.services.root_cause_service import batch_analyze_pending

        total_analyzed = 0
        import time
        start = time.time()

        while True:
            analyzed = await batch_analyze_pending(db, batch_size=500)
            if analyzed == 0:
                break
            total_analyzed += analyzed
            elapsed = time.time() - start
            rate = total_analyzed / elapsed if elapsed > 0 else 0
            if total_analyzed % 2000 < 500:
                print(f"  Analyzed {total_analyzed:,} denials ({rate:.0f}/sec)")

        elapsed = time.time() - start
        print(f"  ✓ Root cause backfill complete: {total_analyzed:,} in {elapsed:.0f}s ({total_analyzed/elapsed:.0f}/sec)")

        # ── VERIFICATION ─────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("VERIFICATION")
        print("=" * 60)

        # Root cause distribution
        r = await db.execute(text("""
            SELECT primary_root_cause, root_cause_group, count(*),
                   avg(confidence_score)::int, sum(financial_impact)::bigint
            FROM root_cause_analysis
            GROUP BY primary_root_cause, root_cause_group
            ORDER BY count(*) DESC
        """))
        print("\nROOT CAUSE DISTRIBUTION:")
        for row in r.all():
            print(f"  {row[0]:25s} [{row[1]:12s}] {row[2]:6,} denials  conf={row[3]}%  ${row[4]:>12,}")

        # Per-payer top root cause
        r = await db.execute(text("""
            SELECT pm.payer_name, rca.primary_root_cause, count(*)
            FROM root_cause_analysis rca
            JOIN payer_master pm ON rca.payer_id = pm.payer_id
            GROUP BY pm.payer_name, rca.primary_root_cause
            ORDER BY pm.payer_name, count(*) DESC
        """))
        print("\nTOP ROOT CAUSE BY PAYER (top 3 per payer):")
        current_payer = None
        payer_count = 0
        for payer_name, cause, cnt in r.all():
            if payer_name != current_payer:
                current_payer = payer_name
                payer_count = 0
            payer_count += 1
            if payer_count <= 2:
                print(f"  {payer_name:30s} → {cause:25s} ({cnt:,})")

        # Eligibility status check
        r = await db.execute(text("SELECT subscriber_status, count(*) FROM eligibility_271 GROUP BY subscriber_status ORDER BY count(*) DESC"))
        print("\nELIGIBILITY STATUS:")
        for row in r.all():
            print(f"  {row[0]:20s}: {row[1]:,}")

        # Auth status check
        r = await db.execute(text("SELECT status, count(*) FROM prior_auth GROUP BY status ORDER BY count(*) DESC"))
        print("\nAUTH STATUS:")
        for row in r.all():
            print(f"  {row[0]:20s}: {row[1]:,}")

        # Bank recon variance
        r = await db.execute(text("""
            SELECT reconciliation_status, count(*), avg(era_bank_variance)::int
            FROM bank_reconciliation GROUP BY reconciliation_status
        """))
        print("\nBANK RECON STATUS:")
        for row in r.all():
            print(f"  {row[0]:20s}: {row[1]:,} records, avg variance ${row[2]:,}")

        # Contract rates
        cr_count = await db.scalar(text("SELECT count(*) FROM payer_contract_rate"))
        print(f"\nCONTRACT RATES: {cr_count:,}")

        print("\n" + "=" * 60)
        print("ENRICHMENT COMPLETE — DATA IS ROCKING!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run())
