E2E demo artifacts for OLPAI

This folder is meant for manual end-to-end testing of:
- Admin contest setup: upload evaluation-set assets (judge + ground truth + inputs)
- Contestant submissions: public predictions.csv and final submission zip (infer.py + model.txt)
- Worker judging pipeline + leaderboard update

Layout:
- draft/e2e-demo/datasets/...
- draft/e2e-demo/btc/public/judge.py
- draft/e2e-demo/btc/final/judge.py
- draft/e2e-demo/contestant/public/predictions.csv
- draft/e2e-demo/contestant/final/submission_final.zip

Notes:
- The worker looks for judge script by asset_key 'judge.py' (or 'judge_script')
- The worker looks for ground truth by asset_key 'ground_truth.csv' (or filename 'public_ground_truth.csv')
- For final inference, infer.py reads input files from the same folder where ground_truth lives.
