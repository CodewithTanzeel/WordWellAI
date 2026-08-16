#!/usr/bin/env python3
"""
Integration test for WordWellAI Space + Backend + Frontend

This script tests that the model pipeline works correctly:
1. Hugging Face Space (via gradio-client)
2. LM Studio (fallback)
3. Local heuristic (final fallback)
"""

import os
import sys
from backend.app.model_client import call_model, _call_hf_space, _call_lm_studio, _local_heuristic

def test_space_integration():
    """Test Hugging Face Space integration"""
    print("\n📡 Testing Hugging Face Space Integration")
    print("-" * 50)
    
    hf_space_url = os.environ.get("HF_SPACE_URL", "warishabilal05/my-lfm25-demo")
    hf_token = os.environ.get("HF_TOKEN", "")
    
    print(f"HF_SPACE_URL: {hf_space_url}")
    print(f"HF_TOKEN: {'***hidden***' if hf_token else 'not set'}")
    
    test_text = "I've been feeling really stressed lately, can't sleep and losing motivation."
    
    print(f"\nTest input: {test_text}")
    print("\nAttempting to call Space...")
    
    result = _call_hf_space(test_text)
    if result:
        print(f"✅ Space responded: {result}")
        return True
    else:
        print("❌ Space call failed (will use fallback)")
        return False

def test_lm_studio_integration():
    """Test LM Studio fallback"""
    print("\n🖥️  Testing LM Studio Integration")
    print("-" * 50)
    
    model_url = os.environ.get("MODEL_URL", "")
    
    print(f"MODEL_URL: {model_url if model_url else 'not set (skipping)'}")
    
    if not model_url:
        print("⏭️  Skipped (MODEL_URL not set)")
        return None
    
    test_text = "I'm doing great! Feeling energized and positive about life."
    print(f"\nTest input: {test_text}")
    
    result = _call_lm_studio(test_text)
    if result:
        print(f"✅ LM Studio responded: {result}")
        return True
    else:
        print("❌ LM Studio call failed (will use fallback)")
        return False

def test_local_heuristic():
    """Test local heuristic fallback"""
    print("\n🧠 Testing Local Heuristic Fallback")
    print("-" * 50)
    
    test_cases = [
        ("I'm feeling great and really happy today!", "low_stress_signals"),
        ("I've been so stressed, can't sleep, losing motivation", "elevated_stress_signals"),
        ("I'm okay, a bit tired but managing", "neutral"),
        ("I feel both hopeful and worried about the future", "mixed_signals"),
    ]
    
    passed = 0
    for text, expected_label in test_cases:
        result = _local_heuristic(text)
        label = result.get("label", "unknown")
        confidence = result.get("confidence", 0)
        
        status = "✅" if label == expected_label else "⚠️"
        print(f"{status} '{text[:40]}...'")
        print(f"   Expected: {expected_label}, Got: {label} ({confidence})")
        
        if label == expected_label:
            passed += 1
    
    print(f"\n{passed}/{len(test_cases)} heuristic tests passed")
    return passed == len(test_cases)

def test_full_pipeline():
    """Test the full model pipeline"""
    print("\n🔄 Testing Full Model Pipeline")
    print("-" * 50)
    
    test_cases = [
        "I can't sleep and I feel hopeless",
        "Had an amazing day, feeling grateful",
        "Just tired, nothing special",
    ]
    
    for text in test_cases:
        print(f"\nInput: {text}")
        result = call_model(text)
        print(f"Result: {result}")

def main():
    print("\n" + "=" * 60)
    print("  WordWellAI Integration Test Suite")
    print("=" * 60)
    
    # Test each component
    space_ok = test_space_integration()
    lm_studio_ok = test_lm_studio_integration()
    heuristic_ok = test_local_heuristic()
    
    print("\n" + "=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"Hugging Face Space: {'✅ OK' if space_ok else '⚠️ Fallback ready'}")
    print(f"LM Studio: {'✅ OK' if lm_studio_ok else ('⏭️ Not configured' if lm_studio_ok is None else '⚠️ Fallback ready')}")
    print(f"Local Heuristic: {'✅ OK' if heuristic_ok else '❌ Failed'}")
    print()
    print("Testing full pipeline...")
    test_full_pipeline()
    
    print("\n" + "=" * 60)
    print("✅ Integration test complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run the backend: uvicorn backend.app.main:app --reload")
    print("2. Run the frontend: npm run dev")
    print("3. Test the full UI workflow")
    print()

if __name__ == "__main__":
    main()
