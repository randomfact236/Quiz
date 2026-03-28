'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getItem, STORAGE_KEYS } from '@/lib/storage';

interface DemographicsData {
  country: string;
  sex: 'male' | 'female';
  ageGroup: string;
}

const STORAGE_KEY = 'aiquiz:demo-data';
const GUEST_ID_KEY = 'aiquiz:guest-id';

function generateGuestId(): string {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getGuestId(): string {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = generateGuestId();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000';

async function sendDemographicsToApi(data: DemographicsData, isLoggedIn: boolean): Promise<void> {
  if (isLoggedIn) {
    const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
    if (token) {
      try {
        await fetch(`${API_URL}/api/v1/auth/demographics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Failed to send demographics to API:', error);
      }
    }
  } else {
    const guestId = getGuestId();
    try {
      await fetch(`${API_URL}/api/v1/guest-users/demographics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId, ...data }),
      });
    } catch (error) {
      console.error('Failed to send guest demographics to API:', error);
    }
  }
}

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina',
  'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde',
  'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China',
  'Colombia', 'Comoros', 'Congo', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Cyprus',
  'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
  'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
  'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe', 'Other'
];

const AGE_GROUPS = [
  { value: '10-15', label: '10-15' },
  { value: '15-20', label: '15-20' },
  { value: '20-25', label: '20-25' },
  { value: '25-30', label: '25-30' },
  { value: '30-35', label: '30-35' },
  { value: '35-40', label: '35-40' },
  { value: '40-45', label: '40-45' },
  { value: '45-50', label: '45-50' },
  { value: '50+', label: '50+' }
];

interface DemographicsPopupProps {
  onComplete?: (data: DemographicsData) => void;
}

export default function DemographicsPopup({ onComplete }: DemographicsPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [country, setCountry] = useState('');
  const [maleAge, setMaleAge] = useState('');
  const [femaleAge, setFemaleAge] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getItem<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsOpen(true);
      return;
    }
    try {
      const data = JSON.parse(stored);
      if (!data || !data.country || !data.sex || !data.ageGroup) {
        setIsOpen(true);
      }
    } catch {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = async () => {
    const sex = maleAge ? 'male' : 'female';
    const ageGroup = maleAge || femaleAge;
    
    if (!country || !sex || !ageGroup) return;

    const data: DemographicsData = { country, sex, ageGroup };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setIsOpen(false);

    await sendDemographicsToApi(data, isLoggedIn);
    onComplete?.(data);
  };

  const handleSkip = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Help Us Know You Better</h2>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 text-sm mt-1">This helps us show you relevant content</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Gender & Age - Two Columns with Dropdowns */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Gender & Age
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Male Dropdown */}
              <div>
                <select
                  value={maleAge}
                  onChange={(e) => {
                    setMaleAge(e.target.value);
                    if (e.target.value) setFemaleAge('');
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    maleAge 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' 
                      : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                  }`}
                >
                  <option value="">Male</option>
                  {AGE_GROUPS.map((age) => (
                    <option key={`male-${age.value}`} value={age.value}>
                      {age.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Female Dropdown */}
              <div>
                <select
                  value={femaleAge}
                  onChange={(e) => {
                    setFemaleAge(e.target.value);
                    if (e.target.value) setMaleAge('');
                  }}
                  className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    femaleAge 
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30' 
                      : 'border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                  }`}
                >
                  <option value="">Female</option>
                  {AGE_GROUPS.map((age) => (
                    <option key={`female-${age.value}`} value={age.value}>
                      {age.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!country || (!maleAge && !femaleAge)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export function getDemographics(): DemographicsData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
