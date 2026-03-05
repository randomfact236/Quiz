export default function ImageRiddlesLoading(): JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center bg-blue-50">
            <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <p className="text-lg font-semibold text-blue-700">Loading Image Riddles...</p>
            </div>
        </div>
    );
}
