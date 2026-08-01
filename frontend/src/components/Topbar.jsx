export default function Topbar({ title, children }) {
  return (
    <div className="topbar">
      <h1>{title}</h1>
      {children && <div className="topbar-right">{children}</div>}
    </div>
  );
}
