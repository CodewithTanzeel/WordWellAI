def is_high_risk(text: str) -> bool:
    if not text or not isinstance(text, str):
        return False
        
    crisis_keywords = [
        "suicide", 
        "kill myself", 
        "end it all", 
        "ending it all",
        "harm myself",
        "hurt myself",
        "alive anymore",
        "disappeared for good"
    ]
    
    text_lower = text.lower()
    
    for keyword in crisis_keywords:
        if keyword in text_lower:
            return True
            
    return False