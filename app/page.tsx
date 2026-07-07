'use client';

import Link from 'next/link';
import {ShoppingBag, Store, Bike, LayoutGrid, ArrowRight} from 'lucide-react';

const portals = [
  {
    href: '/order',
    icon: ShoppingBag,
    title: 'Order Food',
    badge: 'CUSTOMER APP',
    badgeColor: 'bg-peach text-orange-dark',
    description: 'Browse restaurants, search dishes, track your delivery.',
  },
  {
    href: '/restaurant-portal',
    icon: Store,
    title: 'Restaurant Portal',
    badge: 'FOR SELLERS',
    badgeColor: 'bg-peach text-orange-dark',
    description: 'Register your kitchen and get on BigFoods.',
  },
  {
    href: '/rider-portal',
    icon: Bike,
    title: 'Rider Portal',
    badge: 'FOR DISPATCH',
    badgeColor: 'bg-peach text-orange-dark',
    description: 'Apply to ride and earn on your own schedule.',
  },
  {
    href: '/admin',
    icon: LayoutGrid,
    title: 'Admin Console',
    badge: 'INTERNAL',
    badgeColor: 'bg-peach text-orange-dark',
    description: 'Platform dashboard, zone map, and restaurant management.',
  },
];

export default function PortalHome() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{background: 'var(--white)'}}
    >
      <div className="w-full max-w-[360px]">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
            style={{background: 'var(--orange)'}}
          />
          <h1
            className="text-[26px] font-bold tracking-tight mb-1"
            style={{fontFamily: "'Space Grotesk', sans-serif", color: 'var(--ink)'}}
          >
            BigFoods
          </h1>
          <p style={{color: 'var(--gray)', fontSize: '13px'}}>
            Awka, Anambra — choose a portal
          </p>
        </div>

        {/* Portal cards */}
        <div className="flex flex-col gap-3">
          {portals.map(({href, icon: Icon, title, badge, description}) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 transition-all hover:shadow-card active:scale-[0.98]"
              style={{border: '1px solid var(--line)'}}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background: 'var(--peach)'}}
              >
                <Icon className="w-5 h-5" style={{color: 'var(--orange)'}} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="font-semibold text-[15px]"
                    style={{fontFamily: "'Space Grotesk', sans-serif", color: 'var(--ink)'}}
                  >
                    {title}
                  </span>
                  <span
                    className="text-[9.5px] font-bold px-2 py-0.5 rounded-full"
                    style={{background: 'var(--peach)', color: 'var(--orange-dark)'}}
                  >
                    {badge}
                  </span>
                </div>
                <p style={{color: 'var(--gray)', fontSize: '12px', lineHeight: '1.4'}}>
                  {description}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 flex-shrink-0" style={{color: 'var(--gray)'}} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
