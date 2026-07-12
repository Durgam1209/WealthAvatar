import React from 'react';

export default function PhoneFrame({
  title,
  right,
  children,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="phoneFrameWrap">
      <div className="phoneFrame">
        <div className="phoneHeader">
          <div className="brand">
            <span style={{ fontSize: 18 }}>🛡️</span>
            <span>{title}</span>
          </div>
          <div>{right}</div>
        </div>
        <div className="phoneBody">
          {children}
        </div>
      </div>
    </div>
  );
}
