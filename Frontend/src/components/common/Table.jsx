import React from 'react'
import { Edit, Trash2 } from 'lucide-react'

const Table = ({ headers, rows, onEdit, onDelete }) => {
  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-teal-300 border-b border-teal-600">
          {headers.map((header, index) => (
            <th key={index} className="py-2">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-teal-700 text-white hover:bg-teal-700 hover:bg-opacity-50 transition-colors">
            <td className="py-3">{row.email}</td>
            <td className="py-3">
              <button className="text-teal-300 hover:text-white mr-2" onClick={() => onEdit(row)}>
                <Edit size={18} />
              </button>
              <button className="text-teal-300 hover:text-white" onClick={() => onDelete(row)}>
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Table
