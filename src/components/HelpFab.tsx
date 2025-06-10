"use client";

import Image from 'next/image';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';

const HelpFab = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (isMenuOpen) {
      // Start exit animation
      setIsExiting(true);
      setTimeout(() => {
        setIsMenuOpen(false);
        setIsExiting(false);
      }, 200); // Match animation duration
    } else {
      setIsMenuOpen(true);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isMenuOpen) {
          setIsExiting(true);
          setTimeout(() => {
            setIsMenuOpen(false);
            setIsExiting(false);
          }, 200);
        }
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const quickActions = [
    { 
      id: 1, 
      title: 'What is a Blueprint?', 
      description: 'Confused? Read our guide', 
      icon: '/assets/Blueprint.svg',
      link: 'https://docs.zk.email/zk-email-sdk/registry',
      external: true
    },
    { 
      id: 2, 
      title: 'How to create a Blueprint?', 
      description: 'It takes 5 minutes to create one', 
      icon: '/assets/PlusCircle.svg',
      link: 'https://docs.zk.email/zk-email-sdk/create-blueprint',
      external: true
    },
    { 
      id: 3, 
      title: 'How to get an eml file?', 
      description: 'Getting an eml file is easy', 
      icon: '/assets/Mailbox.svg',
      link: 'https://docs.zk.email/zk-email-sdk/get-eml-file',
      external: true
    },
    { 
      id: 4, 
      title: 'How to create zk-proofs?', 
      description: 'Create proofs from blueprints', 
      icon: '/assets/ZK.svg',
      link: 'https://docs.zk.email/zk-email-sdk/get-eml-file',
      external: true
    },
    { 
      id: 5, 
      title: 'SDK Documentation', 
      description: 'Learn how to use our SDK', 
      icon: '/assets/FileCode.svg',
      link: 'https://docs.zk.email/zk-email-sdk/overview-v1',
      external: true
    },
  ];

  const handleActionClick = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsExiting(false);
    }, 200);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50" ref={containerRef}>
      {/* Quick Actions Menu */}
      {isMenuOpen && (
        <div 
          className={`
            absolute 
            bottom-10 
            left-0 
            mb-2 
            w-72 
            bg-white 
            border 
            border-gray-200 
            rounded-xl 
            overflow-hidden
            transform-gpu
            origin-bottom-left
            duration-200
            transition-all
            ${isExiting 
              ? 'scale-95 opacity-0' 
              : 'scale-100 opacity-100 animate-in zoom-in-95'
            }
          `}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Quick Help</h3>
          </div>
          <div className="max-h-80 overflow-y-auto pb-1">
            {quickActions.map((action) => (
              <a
                key={action.id}
                href={action.link}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block
                  w-full 
                  p-4 
                  text-left 
                  hover:bg-gray-50 
                  border-b 
                  border-gray-100 
                  last:border-b-0
                  transition-colors 
                  duration-200
                  focus:outline-none 
                  focus:bg-gray-50
                  no-underline
                "
                tabIndex={0}
                aria-label={`${action.title}: ${action.description}`}
                onClick={handleActionClick}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Image
                      src={action.icon}
                      alt=""
                      width={20}
                      height={20}
                      className="text-gray-600"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {action.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {action.description}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {/* White progressive blur overlay - fixed at bottom, below scrollbar */}
          <div 
            className="
              absolute 
              bottom-0 
              left-0 
              right-3
              h-8 
              bg-gradient-to-t 
              from-white 
              via-white/70 
              to-transparent 
              pointer-events-none
              rounded-b-xl
            "
          />
        </div>
      )}

      {/* Help FAB Button */}
      <button
        type="button"
        className="
          hidden 
          md:flex 
          h-10 
          w-10 
          items-center 
          justify-center 
          rounded-full 
          bg-white 
          hover:bg-gray-100
          border border-gray-200
          transition-colors 
          duration-200 
          focus:outline-none 
        "
        aria-label="Help"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <Image
          src="/assets/QuestionMark.svg"
          alt="Help"
          width={24}
          height={24}
          className="text-gray-600"
        />
      </button>
    </div>
  );
};

export default HelpFab; 