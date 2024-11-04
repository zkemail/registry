import Image from 'next/image';
import Link from 'next/link';
import LoginButton from './LoginButton';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-3 dark:border-grey-800 dark:bg-black">
      <Link href="/" className="flex items-center gap-2">
        <Image src={'/assets/ZKEmailLogoDark.svg'} alt="zkemail-logo" height={24} width={24} />
        <span className="text-xl font-semibold dark:text-white">Registry</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blueprints.."
            className="w-[300px] rounded-lg border px-4 py-2 pl-10 dark:border-grey-700 dark:bg-grey-900 dark:text-white dark:placeholder-grey-400"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <LoginButton />
      </div>
    </nav>
  );
};

export default Navbar;
