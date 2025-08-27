import random
import time
import statistics

# Number of users to simulate
TOTAL_USERS = 1_500_000

# Demographic split
K12_RATIO = 0.80
COLLEGE_RATIO = 0.15
GRAD_RATIO = 0.05

# Simulated response generator
def generate_responses(level):
    if level == "K12":
        return [random.randint(1, 5) for _ in range(30)]
    elif level == "College":
        return [random.randint(2, 6) for _ in range(40)]
    else:  # Graduate
        return [random.randint(3, 7) for _ in range(50)]

# Scoring algorithms
def calculate_iq_score(responses):
    return sum(responses) * 1.5

def calculate_eiq_score(responses):
    return sum(responses) * 2.0

def calculate_alt_score(responses):
    return sum(responses) * 1.2

def normalize_scores(iq, eiq, alt):
    return round((iq + eiq + alt) / 3, 2)

# Simulation main function
def simulate_assessments():
    results = {
        "K12": [],
        "College": [],
        "Graduate": []
    }

    for i in range(TOTAL_USERS):
        # Determine user group
        r = random.random()
        if r < K12_RATIO:
            level = "K12"
        elif r < K12_RATIO + COLLEGE_RATIO:
            level = "College"
        else:
            level = "Graduate"

        responses = generate_responses(level)

        iq = calculate_iq_score(responses)
        eiq = calculate_eiq_score(responses)
        alt = calculate_alt_score(responses)
        combined = normalize_scores(iq, eiq, alt)

        results[level].append(combined)

        if i % 100000 == 0:
            print(f"{i} users processed...")

    return results

# Report summary
def report(results):
    print("\n--- Assessment Results Summary ---")
    for level, scores in results.items():
        print(f"\n{level} Users: {len(scores)}")
        print(f"  Avg Combined Score: {round(statistics.mean(scores), 2)}")
        print(f"  Min: {min(scores)} | Max: {max(scores)}")
        print(f"  Std Dev: {round(statistics.stdev(scores), 2)}")

# Main entry
if __name__ == "__main__":
    start = time.time()
    print("Starting simulation...")
    results = simulate_assessments()
    end = time.time()
    print(f"\nSimulation completed in {round(end - start, 2)} seconds.")
    report(results)