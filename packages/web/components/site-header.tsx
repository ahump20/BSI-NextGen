'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/dashboard', label: 'Live Dashboard' },
  { href: '/teams/atl', label: 'Teams' }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="mb-12 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-primary-500/20 p-3 shadow-card">
          <span className="text-lg font-bold text-primary-200">BSI</span>
        </span>
        <div>
          <p className="font-display text-lg uppercase tracking-[0.3em] text-white/80">BlazeSportsIntel</p>
          <p className="text-sm text-white/60">Cloudflare-native sports intelligence</p>
        </div>
      </div>
      <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx('transition-colors', {
              'text-primary-200': pathname === link.href,
              'hover:text-primary-100': pathname !== link.href
            })}
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://github.com/BlazeSportsIntel"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-primary-400 hover:text-primary-100"
        >
          GitHub Intelligence Hub
        </a>
      </nav>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <Transition show={mobileOpen} as={Fragment}>
        <Dialog onClose={() => setMobileOpen(false)} className="relative z-50 md:hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="flex w-64 flex-col gap-6 border-l border-white/10 bg-slate-950/95 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm uppercase tracking-[0.3em] text-white/60">
                    Navigation
                  </span>
                  <button className="text-white/60" onClick={() => setMobileOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="flex flex-col gap-4 text-sm font-medium text-white/70">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={clsx('rounded px-2 py-1 transition-colors', {
                        'bg-primary-500/10 text-primary-100': pathname === link.href,
                        'hover:bg-white/5 hover:text-white': pathname !== link.href
                      })}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
}
