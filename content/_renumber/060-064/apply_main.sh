#!/bin/bash
# Apply on main (lock must be held): bash apply_main.sh  → validate.sh on the main checkout (tag main), then copy records
W=/home/coder/rebuild-state/plan-tome08; R=/home/coder/bashkirtseff
cd $R || exit 2
bash $W/validate.sh $R main
D=$R/content/_renumber/060-064; mkdir -p $D/tools
cp $W/final/plan-06?.json $W/final/REVIEW-06?.md $W/REVIEW.md $W/CONVENTIONS.md $W/validate.sh $W/apply_main.sh $D/
cp $W/tools/{prereq,common08,title08,fix_060,fix_061,fix_062,fix_063,fix_064,post_apply08}.py $D/tools/
echo COPIED
