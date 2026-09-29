#!/bin/bash
# apply tomes 11+16 on main (run under MAIN_WRITE_LOCK): dry runs, prereqs, --write, post scripts, gates. log dir run-main
set -u
P=/home/coder/rebuild-state/plan-tome1116; R=/home/coder/bashkirtseff; L=$P/run-main; mkdir -p $L
cd $R; git rev-parse --short HEAD > $L/head.txt
F11=$P/final11; F16=$P/final16
T11="$F11/plan-075.json $F11/plan-076.json $F11/plan-077.json $F11/plan-078.json $F11/plan-079.json $F11/plan-080.json"
T16="$F16/plan-101.json $F16/plan-102.json $F16/plan-103.json $F16/plan-104.json $F16/plan-105.json $F16/plan-106.json"
python3 $P/prereq11.py $R > $L/prereq11.txt
python3 $P/prereq16fr.py $R > $L/prereq16fr.txt
just rebuild-carnets $T11 > $L/dry11.txt 2>&1; echo "dry11 rc=$?"
just rebuild-carnets $T16 > $L/dry16.txt 2>&1; echo "dry16 rc=$?"
just rebuild-carnets $T11 --write > $L/write11.txt 2>&1; echo "write11 rc=$?"
python3 $F11/postfix_headings_t11.py $R > $L/postfix11.txt 2>&1; echo "postfix11 rc=$?"
python3 $P/rsrpost.py $R $F11 11 075 076 077 078 079 080 > $L/rsr11.txt 2>&1; echo "rsr11 rc=$?"
just rebuild-carnets $T16 --write > $L/write16.txt 2>&1; echo "write16 rc=$?"
python3 $F16/postfix16.py $R > $L/postfix16.txt 2>&1; echo "postfix16 rc=$?"
python3 $P/post16b.py $R > $L/post16b.txt 2>&1; echo "post16b rc=$?"
python3 $P/rsrpost.py $R $F16 16 101 102 103 104 105 106 > $L/rsr16.txt 2>&1; echo "rsr16 rc=$?"
python3 $P/drawpost.py $R $F16 > $L/draw16.txt 2>&1; echo "draw16 rc=$?"
python3 $P/fixmet.py $R > $L/fixmet.txt 2>&1; echo "fixmet rc=$?"
bash $P/gates.sh $R > $L/gates.txt 2>&1; echo gates done
