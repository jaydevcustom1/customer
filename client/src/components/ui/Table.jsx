import React from 'react';

const Table = ({
  headers,
  children,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-100 bg-white ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {headers.map((header, idx) => (
              <th 
                key={idx} 
                className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, className = '', onClick, ...props }) => (
  <tr 
    onClick={onClick}
    className={`hover:bg-slate-50/50 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`} 
    {...props}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`} {...props}>
    {children}
  </td>
);

export default Table;
