import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-2 text-neutral-700">Questions, club onboarding, or a quick demo? Send us a note.</p>

        <form className="mt-6 space-y-4" onSubmit={(e)=>{e.preventDefault(); setSent(true);}}>
          <div>
            <label className="block text-sm font-medium">Your email</label>
            <input required type="email" className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="you@club.co.uk"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea required className="mt-1 w-full h-32 rounded-xl border px-3 py-2" placeholder="Tell us about your club…"/>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" className="rounded-xl">Send</Button>
            <a className="text-sm text-sky-700 underline" href="mailto:hello@mvpcricket.app">Or email hello@mvpcricket.app</a>
          </div>
          {sent && (<p className="text-sm text-emerald-700">Thanks — we’ll reply shortly.</p>)}
        </form>

        <p className="mt-10 text-sm text-neutral-500"><Link to="/" className="underline">Back to home</Link></p>
      </div>
    </div>
  );
}
