export function Background() {
  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div
          className="orb"
          style={{
            width: 500,
            height: 500,
            top: -100,
            left: -100,
            background: "radial-gradient(circle, #D4A853, transparent 70%)",
          }}
        />
        <div
          className="orb"
          style={{
            width: 600,
            height: 600,
            bottom: -200,
            right: -150,
            background: "radial-gradient(circle, #4ECDC4, transparent 70%)",
            animationDelay: "-7s",
          }}
        />
        <div
          className="orb"
          style={{
            width: 400,
            height: 400,
            top: "40%",
            left: "55%",
            background: "radial-gradient(circle, #F5D799, transparent 70%)",
            animationDelay: "-14s",
          }}
        />
      </div>
      <div className="grain" />
    </>
  );
}
