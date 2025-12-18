#!/usr/bin/env python3
"""
Comprehensive test suite for Markup/BDI API endpoints.

Tests all the Markup/BDI endpoints:
1. POST /api/markup-profile - Create markup profile
2. GET /api/markup-profiles/{company_id} - List all profiles for a company
3. GET /api/markup-profile/{company_id}/{year}/{month} - Get specific profile
4. GET /api/markup-profile/series/{company_id}?months=12 - Get series for donut chart
5. POST /api/markup-profile/copy-previous - Copy previous month config
6. GET /api/markup-profile/current/{company_id} - Get current month profile
"""

import requests
import json
import sys
import os
from datetime import datetime
import math

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://orcements.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class MarkupBDITester:
    def __init__(self):
        self.session = requests.Session()
        self.user_data = None
        self.company_id = "test-company-api"
        self.test_results = {}
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_login(self):
        """Test login with admin credentials"""
        self.log("🔐 Testing login with admin credentials...")
        
        login_data = {
            "email": "admin@lucroliquido.com",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                self.user_data = response.json()
                self.log(f"✅ Login successful! User ID: {self.user_data['user_id']}")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login request error: {str(e)}", "ERROR")
            return False
    
    def test_create_markup_profile(self):
        """Test POST /api/markup-profile - Create markup profile"""
        self.log("📊 Testing POST /api/markup-profile - Create markup profile...")
        
        test_data = {
            "company_id": self.company_id,
            "year": 2025,
            "month": 12,
            "taxes": {
                "simples_effective_rate": 0.083,
                "iss_rate": 0.03,
                "include_materials_in_iss_base": False
            },
            "indirects_rate": 0.10,
            "financial_rate": 0.02,
            "profit_rate": 0.15
        }
        
        try:
            response = self.session.post(f"{API_BASE}/markup-profile", json=test_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Markup profile created successfully!")
                
                # Verify the calculation
                # Formula: markup = ((1+X)*(1+Y)*(1+Z))/(1-I)
                # X = indirects_rate = 0.10
                # Y = financial_rate = 0.02  
                # Z = profit_rate = 0.15
                # I = tax_rate = simples_effective_rate + iss_rate = 0.083 + 0.03 = 0.113
                
                expected_numerator = (1 + 0.10) * (1 + 0.02) * (1 + 0.15)  # 1.1 * 1.02 * 1.15 = 1.2903
                expected_denominator = 1 - 0.113  # 0.887
                expected_markup = expected_numerator / expected_denominator  # ≈ 1.4547
                expected_bdi = (expected_markup - 1) * 100  # ≈ 45.47
                
                actual_markup = result.get('markup_multiplier')
                actual_bdi = result.get('bdi_percentage')
                
                self.log(f"Expected markup: {expected_markup:.4f}, Actual: {actual_markup}")
                self.log(f"Expected BDI: {expected_bdi:.2f}%, Actual: {actual_bdi}%")
                
                # Allow small tolerance for floating point calculations
                if abs(actual_markup - expected_markup) < 0.001 and abs(actual_bdi - expected_bdi) < 0.1:
                    self.log("✅ Markup calculation is correct!")
                    return True
                else:
                    self.log("❌ Markup calculation is incorrect!", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to create markup profile: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating markup profile: {str(e)}", "ERROR")
            return False
    
    def test_get_markup_profiles(self):
        """Test GET /api/markup-profiles/{company_id} - List all profiles for a company"""
        self.log("📋 Testing GET /api/markup-profiles/{company_id} - List profiles...")
        
        try:
            response = self.session.get(f"{API_BASE}/markup-profiles/{self.company_id}")
            
            if response.status_code == 200:
                profiles = response.json()
                self.log(f"✅ Retrieved {len(profiles)} markup profiles")
                
                # Verify we have at least the profile we just created
                if len(profiles) > 0:
                    profile = profiles[0]
                    required_fields = ['id', 'company_id', 'year', 'month', 'markup_multiplier', 'bdi_percentage']
                    
                    for field in required_fields:
                        if field not in profile:
                            self.log(f"❌ Missing required field: {field}", "ERROR")
                            return False
                    
                    self.log("✅ Profile structure is correct!")
                    return True
                else:
                    self.log("⚠️ No profiles found, but request was successful", "WARN")
                    return True
            else:
                self.log(f"❌ Failed to get markup profiles: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting markup profiles: {str(e)}", "ERROR")
            return False
    
    def test_get_specific_markup_profile(self):
        """Test GET /api/markup-profile/{company_id}/{year}/{month} - Get specific profile"""
        self.log("🎯 Testing GET /api/markup-profile/{company_id}/{year}/{month} - Get specific profile...")
        
        try:
            response = self.session.get(f"{API_BASE}/markup-profile/{self.company_id}/2025/12")
            
            if response.status_code == 200:
                profile = response.json()
                self.log("✅ Retrieved specific markup profile")
                
                # Verify the profile data
                if profile.get('company_id') == self.company_id and profile.get('year') == 2025 and profile.get('month') == 12:
                    self.log("✅ Profile data matches request parameters!")
                    return True
                else:
                    self.log("❌ Profile data doesn't match request parameters", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get specific markup profile: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting specific markup profile: {str(e)}", "ERROR")
            return False
    
    def test_get_markup_series(self):
        """Test GET /api/markup-profile/series/{company_id}?months=12 - Get series for donut chart"""
        self.log("📈 Testing GET /api/markup-profile/series/{company_id}?months=12 - Get series...")
        
        try:
            response = self.session.get(f"{API_BASE}/markup-profile/series/{self.company_id}?months=12")
            
            if response.status_code == 200:
                series = response.json()
                self.log(f"✅ Retrieved markup series with {len(series)} items")
                
                # Verify we get exactly 12 items
                if len(series) == 12:
                    self.log("✅ Series contains exactly 12 months!")
                    
                    # Verify structure of each item
                    for item in series:
                        required_fields = ['month', 'year', 'month_num', 'markup', 'bdi', 'has_data']
                        for field in required_fields:
                            if field not in item:
                                self.log(f"❌ Missing required field in series item: {field}", "ERROR")
                                return False
                    
                    self.log("✅ Series structure is correct!")
                    return True
                else:
                    self.log(f"❌ Expected 12 items in series, got {len(series)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get markup series: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting markup series: {str(e)}", "ERROR")
            return False
    
    def test_copy_previous_markup(self):
        """Test POST /api/markup-profile/copy-previous - Copy previous month config"""
        self.log("📋 Testing POST /api/markup-profile/copy-previous - Copy previous month...")
        
        # First create a profile for month 11
        self.log("Creating profile for month 11 first...")
        
        month_11_data = {
            "company_id": self.company_id,
            "year": 2025,
            "month": 11,
            "taxes": {
                "simples_effective_rate": 0.08,
                "iss_rate": 0.025,
                "include_materials_in_iss_base": True
            },
            "indirects_rate": 0.12,
            "financial_rate": 0.025,
            "profit_rate": 0.18
        }
        
        try:
            # Create month 11 profile
            response = self.session.post(f"{API_BASE}/markup-profile", json=month_11_data)
            
            if response.status_code != 200:
                self.log(f"❌ Failed to create month 11 profile: {response.status_code}", "ERROR")
                return False
            
            self.log("✅ Month 11 profile created")
            
            # Now test copy to month 12
            copy_data = {
                "company_id": self.company_id,
                "year": 2025,
                "month": 12
            }
            
            response = self.session.post(f"{API_BASE}/markup-profile/copy-previous", json=copy_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Successfully copied previous month configuration!")
                
                # Verify the copied data by fetching the profile
                verify_response = self.session.get(f"{API_BASE}/markup-profile/{self.company_id}/2025/12")
                
                if verify_response.status_code == 200:
                    copied_profile = verify_response.json()
                    
                    # Check if the rates match the month 11 profile
                    if (copied_profile.get('indirects_rate') == 0.12 and 
                        copied_profile.get('financial_rate') == 0.025 and 
                        copied_profile.get('profit_rate') == 0.18):
                        self.log("✅ Copied profile data is correct!")
                        return True
                    else:
                        self.log("❌ Copied profile data doesn't match source", "ERROR")
                        return False
                else:
                    self.log("❌ Failed to verify copied profile", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to copy previous markup: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error copying previous markup: {str(e)}", "ERROR")
            return False
    
    def test_get_current_markup(self):
        """Test GET /api/markup-profile/current/{company_id} - Get current month profile"""
        self.log("📅 Testing GET /api/markup-profile/current/{company_id} - Get current month...")
        
        try:
            response = self.session.get(f"{API_BASE}/markup-profile/current/{self.company_id}")
            
            if response.status_code == 200:
                current_profile = response.json()
                self.log("✅ Retrieved current month markup profile")
                
                # Verify required fields
                required_fields = ['markup_multiplier', 'bdi_percentage']
                for field in required_fields:
                    if field not in current_profile:
                        self.log(f"❌ Missing required field in current profile: {field}", "ERROR")
                        return False
                
                self.log(f"Current markup multiplier: {current_profile.get('markup_multiplier')}")
                self.log(f"Current BDI percentage: {current_profile.get('bdi_percentage')}")
                self.log("✅ Current profile structure is correct!")
                return True
            else:
                self.log(f"❌ Failed to get current markup: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error getting current markup: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Execute all Markup/BDI tests"""
        self.log("🚀 Starting Markup/BDI API endpoint tests")
        self.log("=" * 70)
        
        tests = [
            ("Login", self.test_login),
            ("Create Markup Profile", self.test_create_markup_profile),
            ("List Markup Profiles", self.test_get_markup_profiles),
            ("Get Specific Profile", self.test_get_specific_markup_profile),
            ("Get Markup Series", self.test_get_markup_series),
            ("Copy Previous Month", self.test_copy_previous_markup),
            ("Get Current Month", self.test_get_current_markup)
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n📋 Executing test: {test_name}")
            try:
                result = test_func()
                results[test_name] = result
                self.test_results[test_name] = result
                
                if not result:
                    self.log(f"❌ Test '{test_name}' failed - continuing with other tests", "ERROR")
            except Exception as e:
                self.log(f"❌ Unexpected error in test '{test_name}': {str(e)}", "ERROR")
                results[test_name] = False
                self.test_results[test_name] = False
        
        # Test summary
        self.log("\n" + "=" * 70)
        self.log("📊 MARKUP/BDI API TEST SUMMARY")
        self.log("=" * 70)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log(f"\n🎯 Final Result: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL MARKUP/BDI TESTS PASSED! API endpoints working correctly.")
            return True
        else:
            self.log("⚠️ SOME TESTS FAILED! Check logs above for details.")
            return False

def main():
    """Main function"""
    tester = MarkupBDITester()
    success = tester.run_all_tests()
    
    # Exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()