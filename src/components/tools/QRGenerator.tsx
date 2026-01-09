import { useState, useRef } from 'react';
import { QrCode, Download, Copy, Check, Link, Mail, Phone, Wifi, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type QRType = 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'location';

export function QRGenerator({ className }: { className?: string }) {
  const [type, setType] = useState<QRType>('url');
  const [value, setValue] = useState('');
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [locationData, setLocationData] = useState({ lat: '', lon: '' });
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRValue = () => {
    switch (type) {
      case 'url': return value.startsWith('http') ? value : `https://${value}`;
      case 'email': return `mailto:${value}`;
      case 'phone': return `tel:${value}`;
      case 'wifi': return `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
      case 'location': return `geo:${locationData.lat},${locationData.lon}`;
      default: return value;
    }
  };

  const qrValue = generateQRValue();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrValue)}`;

  const download = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const types = [
    { id: 'url', label: 'URL', icon: Link },
    { id: 'text', label: 'Text', icon: QrCode },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'phone', label: 'Phone', icon: Phone },
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'location', label: 'Location', icon: MapPin },
  ];

  const hasValue = type === 'wifi' ? wifiData.ssid : type === 'location' ? locationData.lat && locationData.lon : value;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">QR Code Generator</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id as QRType)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                type === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              )}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {type === 'wifi' ? (
          <div className="space-y-3">
            <input
              type="text"
              value={wifiData.ssid}
              onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
              placeholder="Network Name (SSID)"
              className="w-full px-4 py-2 bg-muted rounded-lg"
            />
            <input
              type="password"
              value={wifiData.password}
              onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
              placeholder="Password"
              className="w-full px-4 py-2 bg-muted rounded-lg"
            />
            <select
              value={wifiData.encryption}
              onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value })}
              className="w-full px-4 py-2 bg-muted rounded-lg"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </div>
        ) : type === 'location' ? (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={locationData.lat}
              onChange={(e) => setLocationData({ ...locationData, lat: e.target.value })}
              placeholder="Latitude"
              className="px-4 py-2 bg-muted rounded-lg"
            />
            <input
              type="text"
              value={locationData.lon}
              onChange={(e) => setLocationData({ ...locationData, lon: e.target.value })}
              placeholder="Longitude"
              className="px-4 py-2 bg-muted rounded-lg"
            />
          </div>
        ) : (
          <input
            type={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              type === 'url' ? 'https://example.com' :
              type === 'email' ? 'email@example.com' :
              type === 'phone' ? '+1234567890' :
              'Enter text...'
            }
            className="w-full px-4 py-2 bg-muted rounded-lg"
          />
        )}

        {hasValue && (
          <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg">
            <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRGenerator;
