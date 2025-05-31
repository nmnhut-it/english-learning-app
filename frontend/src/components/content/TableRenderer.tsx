import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface TableRendererProps {
  table: {
    headers: string[];
    rows: string[][];
  };
}

const TableRenderer: React.FC<TableRendererProps> = ({ table }) => {
  if (!table || !table.headers || table.headers.length === 0) {
    return null;
  }

  return (
    <TableContainer component={Paper} sx={{ my: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {table.headers.map((header, index) => (
              <TableCell 
                key={index} 
                sx={{ 
                  fontWeight: 'bold',
                  backgroundColor: 'grey.100' 
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableRenderer;
