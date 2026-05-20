function Button({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled} className="w-full rounded-2xl bg-white py-3 text-sm font-bold text-[#080C18] transition-colors disabled:bg-white/15 disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed [-webkit-tap-highlight-color:transparent]">
            {children}
        </button>
    );
}
export default Button;