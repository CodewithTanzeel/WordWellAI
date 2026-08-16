from gradio_client import Client

client = Client('warishabilal05/my-lfm25-demo')

# Test 1: Positive input
print("Testing POSITIVE input...")
result1 = client.predict(
    prompt='I am so happy and grateful today!', 
    max_new_tokens=128, 
    temperature=0.1, 
    api_name='/generate_response'
)
print('Positive input:', result1)
print()

# Test 2: Negative input
print("Testing NEGATIVE input...")
result2 = client.predict(
    prompt='I feel hopeless and cannot sleep', 
    max_new_tokens=128, 
    temperature=0.1, 
    api_name='/generate_response'
)
print('Negative input:', result2)
print()

# Test 3: Neutral input
print("Testing NEUTRAL input...")
result3 = client.predict(
    prompt='Today is just a normal day', 
    max_new_tokens=128, 
    temperature=0.1, 
    api_name='/generate_response'
)
print('Neutral input:', result3)
