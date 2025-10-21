import { Trash, Pencil } from "lucide-react";
import { LucideIcon } from "lucide-react";

import { headerFont } from "@/app/localFonts";

import styles from "./Table.module.css";
import { AsyncButtonWrapper } from "../AsyncButtonWrapper/AsyncButtonWrapper";
import { EditButton, DeleteButton } from "../Buttons/Buttons";

export interface ITableProps {
    columns: string[];
    rows: Array<Record<string, React.ReactNode>>;
    handleEdit: (rowIndex: number) => void;
    handleDelete: (rowIndex: number) => void;
    columnWidths?: number[];
    editButtonOverride?: LucideIcon;
    deleteButtonOverride?: LucideIcon;
}

export default function Table({
    columns,
    rows,
    handleEdit,
    handleDelete,
    columnWidths,
    editButtonOverride,
    deleteButtonOverride
}: ITableProps) {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                className={`${styles.th} ${headerFont.className}`}
                                style={columnWidths ? { width: `${columnWidths[i]}%` } : undefined}
                            >
                                {col}
                            </th>
                        ))}
                        <th className={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        rows.length === 0 ? (
                            <tr><td className={styles.noData}>No data to display</td></tr>
                        ) : (
                            rows.map((row, i) => (
                                <tr key={i} className={styles.tr}>
                                    {columns.map((col, j) => (
                                        <td
                                            key={col}
                                            className={styles.td}
                                            style={columnWidths ? { width: `${columnWidths[j]}%` } : undefined}
                                        >
                                            {row[col]}
                                        </td>
                                    ))}
                                    <td className={styles.actions}>
                                        <div className={styles.actionsContent}>

                                            <EditButton onClick={() => handleEdit(i)}>
                                                {(() => {
                                                    const EditIcon = editButtonOverride ?? Pencil;
                                                    return <EditIcon size={20} strokeWidth={2} />;
                                                })()}
                                            </EditButton>
                                            <AsyncButtonWrapper
                                                button={
                                                    <DeleteButton >
                                                        {(() => {
                                                            const DeleteIcon = deleteButtonOverride ?? Trash;
                                                            return <DeleteIcon size={20} strokeWidth={2} />;
                                                        })()}
                                                    </DeleteButton>
                                                }
                                                onClick={() => handleDelete(i)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )))}
                </tbody>
            </table>
        </div>
    );
}