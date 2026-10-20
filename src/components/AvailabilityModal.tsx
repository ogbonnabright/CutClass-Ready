import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, AlertCircle, Search } from 'lucide-react';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: (topic?: string) => void;
}

const ACTIVE_DISTRICTS = [
  { name: 'Maitama', city: 'Abuja, FCT', active: true, turnaround: 'Available within 24h' },
  { name: 'Wuse II', city: 'Abuja, FCT', active: true, turnaround: 'Available within 24h' },
  { name: 'Gwarinpa', city: 'Abuja, FCT', active: true, turnaround: 'Available within 24-48h' },
  { name: 'Asokoro', city: 'Abuja, FCT', active: true, turnaround: 'Available within 24h' },
  { name: 'Jabi & Utako', city: 'Abuja, FCT', active: true, turnaround: 'Available within 24-48h' },
  { name: 'Central Business District (CBD)', city: 'Abuja, FCT', active: true, turnaround: 'Available for offices & homes' },
  { name: 'Apo & Guzape', city: 'Abuja, FCT', active: true, turnaround: 'Available within 48h' },
  { name: 'Life Camp & Jahi', city: 'Abuja, FCT', active: true, turnaround: 'Available within 48h' },
];

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  onOpenInquiry,
}) => {
  const [query, setQuery] = useState('');
  const [selectedState, setSelectedState] = useState('Abuja (FCT)');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [notified, setNotified] = useState(false);

  if (!isOpen) return null;

  const isFCT = selectedState.toLowerCase().includes('abuja') || selectedState.toLowerCase().includes('fct');
  
  const filteredDistricts = ACTIVE_DISTRICTS.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registeredEmail) {
      setNotified(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <MapPin className="size-4" />
            Service Coverage
          </div>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
            Check Address Availability
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registration is open nationwide across Nigeria with expanding coverage in major cities and districts.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Select State
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Abuja (FCT)">Abuja (Federal Capital Territory)</option>
                <option value="Lagos">Lagos State (Coming next)</option>
                <option value="Rivers">Rivers State (Port Harcourt)</option>
                <option value="Oyo">Oyo State (Ibadan)</option>
                <option value="Kano">Kano State</option>
                <option value="Enugu">Enugu State</option>
                <option value="Delta">Delta State</option>
                <option value="Other">Other Nigerian State</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Search District / Street
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Maitama, Wuse, Apo..."
                  className="w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Status feedback */}
          {isFCT ? (
            <div className="mt-5">
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Active Coverage Area: Abuja, FCT
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      CutClass mobile barbers are active and visiting verified residential homes and commercial workplaces across Abuja districts.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Supported Abuja Zones ({filteredDistricts.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredDistricts.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background/50 hover:bg-accent/40 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-medium text-foreground">{d.name}</span>
                      <p className="text-[11px] text-muted-foreground">{d.turnaround}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                      Ready
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Registration Open for {selectedState}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      You can register your account today. Home and workplace visits for {selectedState} will roll out as local barber hubs open. Join the priority dispatch list below.
                    </p>
                  </div>
                </div>
              </div>

              {notified ? (
                <div className="rounded-lg bg-primary/10 p-3 text-xs text-primary font-medium text-center">
                  ✓ Priority registered! We will email {registeredEmail} the moment {selectedState} slots open.
                </div>
              ) : (
                <form onSubmit={handleNotifySubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={registeredEmail}
                    onChange={(e) => setRegisteredEmail(e.target.value)}
                    placeholder="Enter your email for launch alerts"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-muted-foreground">
              Need custom arrangements for a hotel or out-of-zone address?
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInquiry(`Address coverage inquiry (${selectedState} - ${query || 'General'})`);
              }}
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Ask our concierge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
