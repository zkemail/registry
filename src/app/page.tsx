'use client';

import { useState } from 'react';
import BlueprintCard from './components/BlueprintCard';
import SearchBar from './components/SearchBar';
import Link from 'next/link';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  console.log(searchQuery);

  const blueprints = [
    {
      title: 'Proof Of Devcon Rejection',
      slug: 'sisujadev/devcon-rejection-proof',
      description:
        'Verifies that an applicant received a rejection email for their Devcon proposal.',
      status: 'Compiled' as const,
      stats: { views: 972, stars: 972, id: 972 },
      extractableValues: ['recipient_name', 'proposal_title', 'rejection_line'],
      updatedAt: '22 hours ago',
      repoLink: '#',
    },
    // Add more blueprints as needed
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Blueprints</h1>
        <div className="flex items-center gap-4">
          <SearchBar onSearch={setSearchQuery} />
          <button className="px-4 py-2 border rounded-lg hover:bg-grey-50">Filters</button>
        </div>
      </div>

      <div className="">
        {blueprints.map((blueprint, index) => (
          <Link key={index} href={`/${encodeURIComponent(blueprint.slug)}`}>
            <BlueprintCard {...blueprint} />
          </Link>
        ))}
      </div>
    </div>
  );
}
