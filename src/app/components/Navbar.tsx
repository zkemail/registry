import Image from 'next/image';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white dark:bg-black border-b dark:border-grey-800">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Image src={'/assets/ZKEmailLogoDark.svg'} alt="zkemail-logo" height={24} width={24} />
        </Link>
        <span className="text-xl font-semibold dark:text-white">Registry</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blueprints.."
            className="px-4 py-2 pl-10 border rounded-lg w-[300px] dark:bg-grey-900 dark:border-grey-700 dark:text-white dark:placeholder-grey-400"
          />
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-grey-400"
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

        <button className="px-4 py-2 text-white bg-black dark:bg-white dark:text-black rounded-lg">
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
