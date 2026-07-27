import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, MapPinned, Plus, ShieldCheck, Smartphone, Trash2, UsersRound } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  initials: string;
}

const SafetyCenter: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: 1, name: 'Adekemi M.', phone: '+234 803 555 0142', initials: 'AM' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shared, setShared] = useState(false);

  const addContact = () => {
    if (!name.trim() || !phone.trim()) return;
    setContacts((current) => [
      ...current,
      {
        id: Date.now(),
        name: name.trim(),
        phone: phone.trim(),
        initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      },
    ]);
    setName('');
    setPhone('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <section className="rounded-3xl bg-[#102a43] p-5 text-white">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.03em]">Safety centre</h1>
        <p className="mt-2 text-sm leading-6 text-blue-100">Manage trusted contacts, trip sharing, and verification from one place.</p>
      </section>

      <Card className="rounded-3xl border-blue-100">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-950">Share active trip</h2>
              <p className="mt-1 text-xs text-slate-500">Send live location and trip status to your contacts.</p>
            </div>
            {shared ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <MapPinned className="h-6 w-6 text-blue-700" />}
          </div>
          <Button
            onClick={() => setShared((current) => !current)}
            variant={shared ? 'secondary' : 'default'}
            className={`mt-4 h-11 w-full rounded-xl font-bold ${shared ? 'text-emerald-700' : 'bg-blue-700 hover:bg-blue-800'}`}
          >
            {shared ? 'Trip shared with trusted contacts' : 'Share current trip'}
          </Button>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-950">Emergency contacts</h2>
            <p className="mt-1 text-xs text-slate-500">People who can receive your trip status.</p>
          </div>
          <Button size="icon" onClick={() => setShowAdd(true)} className="h-10 w-10 rounded-full bg-blue-700" aria-label="Add emergency contact">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex min-h-18 items-center gap-3 border-b border-slate-100 p-4 last:border-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xs font-extrabold text-blue-700">{contact.initials}</span>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-950">{contact.name}</p>
                <p className="mt-1 text-xs text-slate-500">{contact.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setContacts((current) => current.filter((item) => item.id !== contact.id))}
                className="h-10 w-10 rounded-full text-slate-400 hover:text-red-600"
                aria-label={`Remove ${contact.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-2">
        <button type="button" className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <Smartphone className="h-5 w-5 text-blue-700" />
          <span className="flex-1"><span className="block text-sm font-extrabold text-slate-950">Phone verification</span><span className="block text-xs text-slate-500">Verify the number used for trip updates</span></span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
        <button type="button" className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left">
          <UsersRound className="h-5 w-5 text-blue-700" />
          <span className="flex-1"><span className="block text-sm font-extrabold text-slate-950">Identity and vehicle checks</span><span className="block text-xs text-slate-500">Review your trust and verification status</span></span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add emergency contact</DialogTitle>
            <DialogDescription>This person can receive live trip updates when you choose to share.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="h-12 rounded-xl" />
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 800 000 0000" className="h-12 rounded-xl" />
            <Button onClick={addContact} disabled={!name.trim() || !phone.trim()} className="h-12 w-full rounded-xl bg-blue-700 font-bold hover:bg-blue-800">
              Save contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SafetyCenter;
