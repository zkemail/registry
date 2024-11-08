import ProofStatusTable from '../components/ProofStatusTable';

const ViewProof = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="flex w-full flex-col gap-1">
        <h4 className="text-xl font-bold text-grey-800">View Proof</h4>
        <p className="text-base font-medium text-grey-700">
          Please standby, proof generation takes a few seconds
        </p>
      </div>
      <ProofStatusTable />
    </div>
  );
};

export default ViewProof;
