interface SearchBarProps {
    onSearch: (query: string) => void;
  }
  
  const SearchBar = ({ onSearch }: SearchBarProps) => {
    return (
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search blueprints.."
          className="w-full px-4 py-2 pl-10 border rounded-lg"
          onChange={(e) => onSearch(e.target.value)}
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
    );
  };
  
  export default SearchBar;