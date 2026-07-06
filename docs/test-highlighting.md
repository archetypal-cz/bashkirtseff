# Highlighting Test

Open this file with the bashkirtseff-highlighting extension active
(.vscode/bashkirtseff-highlighting/) and verify each pattern below gets
its distinct styling. Updated 2026-07-06 to match current notation.

## Paragraph IDs (bold blue)

%% 001.0001 %%

%% 083.2453 %%

## Glossary tags (italic teal)

%% [#Nice](../_glossary/places/cities/NICE.md) %%

%% [#Nice](../_glossary/places/cities/NICE.md) [#Promenade_des_Anglais](../_glossary/places/landmarks/PROMENADE_DES_ANGLAIS.md) %%

## Timestamped role comments (green timestamp, yellow role, orange text)

All current role codes must highlight:

%% 2025-12-07T16:00:00 RSR: Researcher note %%
%% 2026-02-09T16:30:00 LAN: Linguistic annotator note %%
%% 2026-03-01T10:00:00 TR: Translator note %%
%% 2026-03-02T11:00:00 GEM: Gemini editor note %%
%% 2026-03-03T12:00:00 OPS: Opus editor note %%
%% 2026-03-04T13:00:00 RED: Editor note %%
%% 2026-03-05T14:00:00 CON: Conductor note %%
%% 2026-03-06T15:00:00 ED: Executive director note %%
%% 2026-03-07T16:00:00 PPX: Perplexity note %%
%% 2026-03-08T17:00:00 KRR: Human owner note %%
%% 2026-03-09T18:00:00 PA: Project assistant note %%

## Tag annotations (italic orange)

%%[end-note 1]%%

%%[location Nice]%%

## French original text (light blue — letter start, 20+ chars)

%% Samedi 11 janvier 1873. Il fait un temps superbe aujourd'hui. %%

## General comments (italic gray)

%%short gray comment%%

## Footnotes (NOT yet handled by the grammar — known gap)

Text with a footnote reference[^63.05.2] in the middle.

[^63.05.2]: Footnote definition text, per-paragraph numbering NN.NN.N.

## Legacy format (NOT handled — 110 files still carry legacy comments)

[//]: # ( 2025-07-19T19:22:00 RSR: legacy-format comment, gets no highlighting )

## Mixed inline

In paragraph %% 001.0002 %%, Marie writes %%her thoughts%% with %%[location Nice]%%.
