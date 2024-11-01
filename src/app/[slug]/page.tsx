'use client';

import Image from 'next/image';
import { getStatusColorLight, getStatusIcon } from '../utils';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import { useState } from 'react';

const blueprint = {
  title: 'Proof Of Devcon Rejection',
  slug: 'sisujadev/devcon-rejection-proof',
  description: 'Verifies that an applicant received a rejection email for their Devcon proposal.',
  status: 'Compiled' as const,
  stats: { views: 972, stars: 972, id: 972 },
  extractableValues: ['recipient_name', 'proposal_title', 'rejection_line'],
  updatedAt: '22h ago',
  repoLink: '#',
};

const Pattern = ({ params }: { params: { slug: string } }) => {
  const slug = decodeURIComponent(params.slug);
  const [step, setStep] = useState(0);
  //   const [blueprint, setBlueprint] = useState(blueprintData);
  console.log(slug);

  return (
    <div className="flex flex-col mx-auto py-16 gap-10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-xl">{blueprint.title}</h2>
            <span
              className={`px-2 py-1 flex flex-row gap-1 rounded-full text-xs font-semibold ${getStatusColorLight(
                blueprint.status
              )}`}
            >
              <Image
                width={12}
                height={12}
                src={getStatusIcon(blueprint.status)}
                alt={blueprint.status}
              />
              {blueprint.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-grey-600">
            <span className="flex flex-row gap-1 border border-grey-400 rounded px-2 py-1 text-grey-800 font-medium">
              <Image width={16} height={16} src="assets/Users.svg" alt="views" />{' '}
              {blueprint.stats.views}
            </span>
            <span className="flex flex-row gap-1 bg-white border border-grey-500 rounded px-2 py-1 font-semibold text-grey-800">
              <Image width={16} height={16} src="assets/Star.svg" alt="stars" /> Stars |{' '}
              {blueprint.stats.stars}
            </span>
          </div>
        </div>
        <p className="text-md font-medium text-grey-800 mb-4">{blueprint.description}</p>
      </div>
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center justify-between gap-3">
          <span className="text-xl underline font-bold leading-6">1.4.4</span>
          <span>
            <p className="text-xs text-grey-700">Updated {blueprint.updatedAt}</p>
          </span>
          <span>
            <span
              className={`px-2 py-1 flex flex-row gap-1 rounded-full text-xs font-semibold border border-[#34C759] text-[#34C759] bg-white`}
            >
              Latest
            </span>
          </span>
        </div>
        <div>
          <Button onClick={() => {setStep(step + 1)}} startImg="assets/GitCommit.svg">
            View all versions
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 flex flex-col gap-6 border border-grey-500 shadow-[2px_4px_2px_0px_rgba(0,0,0,0.02),_2px_3px_4.5px_0px_rgba(0,0,0,0.07)]">
        <h4 className="text-lg font-bold text-grey-800">Generate Proof</h4>
        <Stepper
          steps={['Connect emails', 'Select emails', 'View and verify']}
          currentStep={step}
        />
      </div>
    </div>
  );
};

export default Pattern;
