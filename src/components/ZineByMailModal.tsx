// If you get a type error for 'react-places-autocomplete', add a .d.ts file with:
// declare module 'react-places-autocomplete';
import React, { useState } from "react";
import PlacesAutocomplete from "react-places-autocomplete";
import clsx from "clsx";
import emailjs from '@emailjs/browser';

// Add google to window type
declare global {
  interface Window {
    google: any;
  }
}

interface ZineByMailModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; address1: string; address2: string; city: string; state: string; zip: string }) => void;
}

export default function ZineByMailModal({ open, onClose, onSubmit }: ZineByMailModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  // Helper to parse address components from Google Places
  function handleSelect(address: string, placeId?: string) {
    // Use Google Maps PlacesService to get details
    if (window.google && placeId) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({ placeId }, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          let streetNumber = "";
          let route = "";
          let city = "";
          let state = "";
          let zip = "";
          
          place.address_components.forEach((comp: any) => {
            if (comp.types.includes("street_number")) streetNumber = comp.long_name;
            if (comp.types.includes("route")) route = comp.long_name;
            if (comp.types.includes("locality")) city = comp.long_name;
            if (comp.types.includes("administrative_area_level_1")) state = comp.short_name;
            if (comp.types.includes("postal_code")) zip = comp.long_name;
          });
          
          // Set only the street address (number + route) in Address Line 1
          const streetAddress = streetNumber && route ? `${streetNumber} ${route}` : address.split(',')[0];
          setAddress1(streetAddress);
          setCity(city);
          setState(state);
          setZip(zip);
        } else {
          // Fallback: just use the first part of the address (before first comma)
          setAddress1(address.split(',')[0]);
        }
      });
    } else {
      // Fallback: just use the first part of the address (before first comma)
      setAddress1(address.split(',')[0]);
    }
  }

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !email || !address1 || !city || !state || !zip) {
      setError("Please fill in all required fields.");
      return;
    }
    
    setError("");
    setSubmitting(true);
    
    try {
      // First, send to our API endpoint for logging
      const response = await fetch('/api/zine-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, address1, address2, city, state, zip }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit request');
      }
      
      // Send email via EmailJS
      const templateParams = {
        name: name,
        email: email,
        address1: address1,
        address2: address2 || '',
        city: city,
        state: state,
        zip: zip,
        timestamp: new Date().toISOString()
      };
      
      await emailjs.send(
        'service_c71jyfn', // Service ID
        'template_f4l7r9c', // Template ID
        templateParams,
        '_hyQbuiKjCgO4Ppn3' // Public Key
      );
      
      setSubmitted(true);
      
    } catch (error) {
      console.error('EmailJS error:', error);
      setError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-8 flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <img src="/images/close_square.svg" alt="Close" className="w-6 h-6" />
        </button>
        
        {submitted ? (
          <>
            <h2 className="font-videocond font-bold text-2xl mb-4 text-center">Thanks for submitting a zine request!</h2>
            <p className="font-videocond font-light text-lg mb-6 text-center">
              Debbie will be in touch shortly to let you know when you can expect to receive something special in the mail &lt;3
            </p>
            <button
              onClick={onClose}
              className="bg-black text-white rounded-full px-6 py-2 font-videocond font-bold text-xl hover:bg-gray-900 transition cursor-pointer"
            >
              CLOSE
            </button>
          </>
        ) : (
          <>
            <h2 className="font-videocond font-bold text-3xl mb-4 text-center">WANNA HOLD HISTORY?</h2>
            <p className="font-videocond font-light text-lg mb-2 text-center">
              I'd love to mail you a physical copy to commemorate the moment.
            </p>
            <p className="font-videocond font-light text-sm mb-6 text-center text-gray-600">
              Limited copies available • US addresses only
            </p>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block font-videocond font-bold text-base mb-2">Name</label>
            <input
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-videocond font-bold text-base mb-2">Email</label>
            <input
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-videocond font-bold text-base mb-2">Address Line 1 (US only)</label>
            <PlacesAutocomplete
              value={address1}
              onChange={setAddress1}
              onSelect={(address: string, placeId?: string) => handleSelect(address, placeId)}
              searchOptions={{ componentRestrictions: { country: 'us' } }}
            >
              {({ getInputProps, suggestions, getSuggestionItemProps, loading }: any) => (
                <div>
                  <input
                    {...getInputProps({
                      placeholder: "Start typing your address...",
                      className: "w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
                    })}
                    required
                  />
                  <div className="bg-white rounded shadow mt-1 max-h-40 overflow-y-auto">
                    {loading && <div className="px-3 py-1 text-gray-500 font-videocond text-base">Searching addresses...</div>}
                    {suggestions.map((suggestion: any) => (
                      <div
                        {...getSuggestionItemProps(suggestion, {
                          className: clsx(
                            "px-3 py-2 cursor-pointer font-videocond text-base",
                            suggestion.active ? "bg-gray-200" : ""
                          )
                        })}
                        key={suggestion.placeId}
                      >
                        {suggestion.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </PlacesAutocomplete>
          </div>
          <div>
            <label className="block font-videocond font-bold text-base mb-2">Address Line 2 (Apt, Suite, etc)</label>
            <input
              className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
              value={address2}
              onChange={e => setAddress2(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-videocond font-bold text-base mb-2">City</label>
              <input
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
                value={city}
                onChange={e => setCity(e.target.value)}
                required
              />
            </div>
            <div className="w-20">
              <label className="block font-videocond font-bold text-base mb-2">State</label>
              <input
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
                value={state}
                onChange={e => setState(e.target.value)}
                required
              />
            </div>
            <div className="w-24">
              <label className="block font-videocond font-bold text-base mb-2">ZIP</label>
              <input
                className="w-full border border-gray-400 rounded-lg px-4 py-2 text-base font-videocond focus:outline-none focus:ring-2 focus:ring-black"
                value={zip}
                onChange={e => setZip(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <div className="text-red-500 font-videocond text-sm text-center">{error}</div>}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white rounded-full px-6 py-2 font-videocond font-bold text-xl hover:bg-gray-900 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "SENDING..." : "REQUEST ZINE"}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
} 