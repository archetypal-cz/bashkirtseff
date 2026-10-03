-- Fix-up for reader reports that still point at paragraph IDs from before the carnet renumberings.
-- Generated 2026-10-03 by "just renumber-audit --write-migration" (src/scripts/renumber-audit.ts) from an owner-exported
-- reports file plus the git history of content/_renumber/*.json; reviewed by the owner before commit.
-- Each row below was judged NOT_APPLIED: its commit predates the maps and its highlighted text (or the absence of any
-- other candidate) says the old ID was never remapped. The id AND the old paragraph_id are both in the WHERE clause,
-- so a row that changed meanwhile is left alone and re-running is harmless.
-- Targets follow the legacy renumber scripts only; scripts applied by the deploy runner are not duplicated here.
-- Rows: 27 (12 generated + 15 adjudicated by hand, see docs/research/renumber-audit-2026-10-03.md)

UPDATE public.paragraph_reports SET paragraph_id = '040.0003' WHERE id = '50a5704d-0da7-4a89-ae32-25f100c7ff76' AND paragraph_id = '040.0006';
UPDATE public.paragraph_reports SET paragraph_id = '069.0513' WHERE id = '1b12ed71-1d45-4bce-85b7-affb67915f94' AND paragraph_id = '069.0460';
UPDATE public.paragraph_reports SET paragraph_id = '069.0535' WHERE id = '02efd7d1-34f1-473a-8ab0-a856a226379a' AND paragraph_id = '069.0466';
UPDATE public.paragraph_reports SET paragraph_id = '099.0242' WHERE id = 'c27ab649-fffe-4409-9df3-a6f8fdca7232' AND paragraph_id = '099.0235';
UPDATE public.paragraph_reports SET paragraph_id = '096.0090' WHERE id = 'd4814d31-9cd6-48ac-9211-1f62ca6a3ccf' AND paragraph_id = '096.0088';
UPDATE public.paragraph_reports SET paragraph_id = '050.0961' WHERE id = '96319272-1e45-4019-8ac1-4e9e0d576db1' AND paragraph_id = '050.0962';
UPDATE public.paragraph_reports SET paragraph_id = '050.1059' WHERE id = '8e9f2884-7f1d-4cd6-920b-f4d1f2aac8c6' AND paragraph_id = '050.1060';
UPDATE public.paragraph_reports SET paragraph_id = '001.0057' WHERE id = '50664e5b-5fec-4e60-92b0-526b6ce1bfb4' AND paragraph_id = '001.0063';
UPDATE public.paragraph_reports SET paragraph_id = '001.0061' WHERE id = 'a24e1593-2eef-4665-8b23-f9aa0908e6b7' AND paragraph_id = '001.0068';
UPDATE public.paragraph_reports SET paragraph_id = '001.0083' WHERE id = '8a9aec23-a51c-4362-b7b2-8bbd2dd0b526' AND paragraph_id = '001.0093';
UPDATE public.paragraph_reports SET paragraph_id = '001.0124' WHERE id = 'bc17e091-c215-45d5-ba1a-76dd82243303' AND paragraph_id = '001.0137';
UPDATE public.paragraph_reports SET paragraph_id = '050.1192' WHERE id = '38f76ff3-3a12-4379-ab16-fd086227cebf' AND paragraph_id = '050.1193';

-- Adjudicated rows (2026-10-03): AMBIGUOUS in the tool's output, resolved with high confidence by an independent review
-- of each paragraph at the report's build commit vs HEAD. Evidence: the legacy renumber scripts were never applied on
-- prod (0 APPLIED; every highlighted report still sits at the ID its build showed), so no row can already be remapped.
-- adjudicated: commit hash unknown, filed in May before all 034 maps; text identical at 034.0030
UPDATE public.paragraph_reports SET paragraph_id = '034.0030' WHERE id = '8f28f532-b348-46b5-bb35-f3f5d453cd33' AND paragraph_id = '034.0033';
-- adjudicated: French identical at HEAD 097.0087
UPDATE public.paragraph_reports SET paragraph_id = '097.0087' WHERE id = 'fc35c912-2a7f-426e-aa0b-1834360c2134' AND paragraph_id = '097.0081';
-- adjudicated: French identical at HEAD 105.0046
UPDATE public.paragraph_reports SET paragraph_id = '105.0046' WHERE id = '63b88a3f-69e5-4a0e-9b5d-71ef55d6be6e' AND paragraph_id = '105.0050';
-- adjudicated: same date-heading paragraph, now 105.0104
UPDATE public.paragraph_reports SET paragraph_id = '105.0104' WHERE id = '7a1647ca-211b-49e9-b3de-548977741ae4' AND paragraph_id = '105.0111';
-- adjudicated: same date-heading paragraph, now 105.0144
UPDATE public.paragraph_reports SET paragraph_id = '105.0144' WHERE id = 'de05e615-2d81-487e-9e87-fd65e987a4f3' AND paragraph_id = '105.0153';
-- adjudicated: same date-heading paragraph, now 105.0160
UPDATE public.paragraph_reports SET paragraph_id = '105.0160' WHERE id = 'ebfe8735-000c-4cdb-863d-4074a57984f0' AND paragraph_id = '105.0171';
-- adjudicated: short highlight in old ID at commit; same paragraph at HEAD 001.0044
UPDATE public.paragraph_reports SET paragraph_id = '001.0044' WHERE id = 'fa3ae921-aa8b-4478-9281-e5eb0c25b8da' AND paragraph_id = '001.0049';
-- adjudicated: French identical at HEAD 099.0244; report predates the map
UPDATE public.paragraph_reports SET paragraph_id = '099.0244' WHERE id = 'd9520eb6-0cd1-4998-b591-f38bda9d5e39' AND paragraph_id = '099.0237';
-- adjudicated: French identical at HEAD 099.0254
UPDATE public.paragraph_reports SET paragraph_id = '099.0254' WHERE id = '9c6dc627-aad5-4cd7-a2bd-e9dd902d8638' AND paragraph_id = '099.0247';
-- adjudicated: dropped half of a split paragraph; highlight spans both halves, joined at HEAD 099.0258
UPDATE public.paragraph_reports SET paragraph_id = '099.0258' WHERE id = 'd1d45e58-6cfc-4595-8bcc-5588d193b1bb' AND paragraph_id = '099.0252';
-- adjudicated: French identical at HEAD 099.0268
UPDATE public.paragraph_reports SET paragraph_id = '099.0268' WHERE id = '53081d82-667f-4ca1-99c8-128e82a52a23' AND paragraph_id = '099.0263';
-- adjudicated: best match is old ID at commit; uniform +3 shift, same text at HEAD 093.0028
UPDATE public.paragraph_reports SET paragraph_id = '093.0028' WHERE id = '41a3fd14-ddcf-4ad6-b2e5-383e9f505565' AND paragraph_id = '093.0025';
-- adjudicated: old paragraph split into 068.0004-0007 at HEAD; head of split chosen
UPDATE public.paragraph_reports SET paragraph_id = '068.0004' WHERE id = '1ad4fde2-dd5a-49be-96c2-330071b64b0b' AND paragraph_id = '068.0005';
-- adjudicated: reader comment refers to old ID; French identical at HEAD 001.0115
UPDATE public.paragraph_reports SET paragraph_id = '001.0115' WHERE id = '4ea4e9e6-63a4-4766-a1c3-474b49d8e5bf' AND paragraph_id = '001.0127';
-- adjudicated: French identical at HEAD 014.0053; highlighted word present
UPDATE public.paragraph_reports SET paragraph_id = '014.0053' WHERE id = 'fefaf3ae-92c1-4be7-ac0b-fe173df8472a' AND paragraph_id = '014.0056';
-- owner (KRR) 2026-10-03: reader quoted the opening of old 014.0017 (= HEAD 014.0016), menu opened on the wrong paragraph
UPDATE public.paragraph_reports SET paragraph_id = '014.0016' WHERE id = '5abb6cfa-5ebf-4fe5-a394-3b3013077b91' AND paragraph_id = '014.0036';
