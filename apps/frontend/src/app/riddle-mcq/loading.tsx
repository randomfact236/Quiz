export default function RiddlesLoading(): JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8]">
            <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-lg font-semibold text-indigo-900">Loading Riddles...</p>
            </div>
        </div>
    );
}
