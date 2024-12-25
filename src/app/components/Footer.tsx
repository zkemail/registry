'use client';

import Image from "next/image";
import Link from 'next/link';
import { useState } from 'react';

const Footer = () => {
  const [hoveredImages, setHoveredImages] = useState({
    XLogo: false,
    YoutubeLogo: false,
    TelegramLogo: false,
    GithubLogo: false,
  });

  const handleMouseEnter = (image: 'XLogo' | 'YoutubeLogo' | 'TelegramLogo' | 'GithubLogo') => {
    setHoveredImages((prev) => ({ ...prev, [image]: true }));
  };

  const handleMouseLeave = (image: 'XLogo' | 'YoutubeLogo' | 'TelegramLogo' | 'GithubLogo') => {
    setHoveredImages((prev) => ({ ...prev, [image]: false }));
  };

  return (
    (<footer className="w-full border-t border-grey-100 bg-white py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Left side - Links */}
        <div className="flex items-center gap-4">
          <Link
            href="https://docs.zk.email/introduction"
            target="_blank"
            className="text-grey-800 hover:text-grey-900"
          >
            Documentation
          </Link>
          <span className="text-grey-300">•</span>
          <Link
            href="https://zk.email/privacy-policy"
            target="_blank"
            className="text-grey-800 hover:text-grey-900"
          >
            Privacy Policy
          </Link>
        </div>

        {/* Right side - Social Icons */}
        <div className="flex items-center gap-4">
          <Link href="https://x.com/zkemail?lang=en" target="_blank">
            <Image
              onMouseEnter={() => handleMouseEnter('XLogo')}
              onMouseLeave={() => handleMouseLeave('XLogo')}
              src={hoveredImages['XLogo'] ? '/assets/XLogoFilled.svg' : '/assets/XLogo.svg'}
              alt="twitter-logo"
              height={20}
              width={20}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto"
              }} />
          </Link>
          <Link href="https://www.youtube.com/@sigsing" target="_blank">
            <Image
              onMouseEnter={() => handleMouseEnter('YoutubeLogo')}
              onMouseLeave={() => handleMouseLeave('YoutubeLogo')}
              src={
                hoveredImages['YoutubeLogo']
                  ? '/assets/YoutubeLogoFilled.svg'
                  : '/assets/YoutubeLogo.svg'
              }
              alt="youtube-logo"
              height={20}
              width={20}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto"
              }} />
          </Link>
          <Link href="https://t.me/zkemail" target="_blank">
            <Image
              onMouseEnter={() => handleMouseEnter('TelegramLogo')}
              onMouseLeave={() => handleMouseLeave('TelegramLogo')}
              src={
                hoveredImages['TelegramLogo']
                  ? '/assets/TelegramLogoFilled.svg'
                  : '/assets/TelegramLogo.svg'
              }
              alt="telegram-logo"
              height={20}
              width={20}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto"
              }} />
          </Link>
          <Link href="https://github.com/zkemail" target="_blank">
            <Image
              onMouseEnter={() => handleMouseEnter('GithubLogo')}
              onMouseLeave={() => handleMouseLeave('GithubLogo')}
              src={
                hoveredImages['GithubLogo']
                  ? '/assets/GithubLogoFilled.svg'
                  : '/assets/GithubLogo.svg'
              }
              alt="github-logo"
              height={20}
              width={20}
              sizes="100vw"
              style={{
                width: "100%",
                height: "auto"
              }} />
          </Link>
        </div>
      </div>
    </footer>)
  );
};

export default Footer;
