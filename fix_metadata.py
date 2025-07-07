#!/usr/bin/env python3
"""
Script to fix inconsistent metadata format in .meta.json files.
Ensures departments and countries are stored as arrays of strings.
"""

import json
import os
from pathlib import Path

def fix_metadata_format(metadata):
    """
    Fix metadata format to ensure departments and countries are arrays of strings.
    """
    fixed = metadata.copy()
    
    # Fix departments
    if "departments" in fixed:
        if isinstance(fixed["departments"], str):
            # Single string - split by comma
            fixed["departments"] = [dept.strip() for dept in fixed["departments"].split(",")]
        elif isinstance(fixed["departments"], list):
            # List - check if it contains comma-separated strings
            new_departments = []
            for item in fixed["departments"]:
                if isinstance(item, str) and "," in item:
                    # Split comma-separated string
                    new_departments.extend([dept.strip() for dept in item.split(",")])
                else:
                    new_departments.append(item)
            fixed["departments"] = new_departments
    
    # Fix countries
    if "countries" in fixed:
        if isinstance(fixed["countries"], str):
            # Single string - split by comma
            fixed["countries"] = [country.strip() for country in fixed["countries"].split(",")]
        elif isinstance(fixed["countries"], list):
            # List - check if it contains comma-separated strings
            new_countries = []
            for item in fixed["countries"]:
                if isinstance(item, str) and "," in item:
                    # Split comma-separated string
                    new_countries.extend([country.strip() for country in item.split(",")])
                else:
                    new_countries.append(item)
            fixed["countries"] = new_countries
    
    return fixed

def main():
    # Path to the raw_data directory
    raw_data_dir = Path(__file__).parent / "pipeline" / "data" / "raw_data"
    
    if not raw_data_dir.exists():
        print(f"Directory not found: {raw_data_dir}")
        return
    
    # Find all .meta.json files
    meta_files = list(raw_data_dir.glob("*.meta.json"))
    
    print(f"Found {len(meta_files)} metadata files to check...")
    
    fixed_count = 0
    
    for meta_file in meta_files:
        try:
            # Read the metadata
            with open(meta_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            # Fix the format
            fixed_metadata = fix_metadata_format(metadata)
            
            # Check if changes were made
            if metadata != fixed_metadata:
                print(f"Fixing: {meta_file.name}")
                print(f"  Before: departments={metadata.get('departments')}")
                print(f"  After:  departments={fixed_metadata.get('departments')}")
                print(f"  Before: countries={metadata.get('countries')}")
                print(f"  After:  countries={fixed_metadata.get('countries')}")
                
                # Write the fixed metadata back
                with open(meta_file, 'w', encoding='utf-8') as f:
                    json.dump(fixed_metadata, f, indent=2)
                
                fixed_count += 1
            
        except Exception as e:
            print(f"Error processing {meta_file.name}: {e}")
    
    print(f"\nFixed {fixed_count} metadata files.")
    print("All metadata files now have consistent format (arrays of strings).")

if __name__ == "__main__":
    main()
