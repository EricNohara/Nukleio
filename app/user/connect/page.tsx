"use client";

import { RefreshCcw } from "lucide-react";

import PageContentHeader from "@/app/components/PageContentHeader/PageContentHeader";
import { IButton } from "@/app/components/PageContentHeader/PageContentHeader";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";


const buttonOne: IButton = {
  name: "Generate API Key",
  onClick: () => { }
}

const buttonFour: IButton = {
  name: "API Docs",
  onClick: () => { }
}

const columns = ["Description", "Created", "Expires", "Last Used"];
const columnWidths = [40, 20, 20, 20];

export default function ConnectPage() {
  const { state } = useUser();
  const handleEdit = () => { }
  const handleDelete = () => { }

  const rows = state.api_keys.map((key) => ({
    "Description": key.description,
    "Created": key.created,
    "Expires": key.expires ? key.expires : "Never",
    "Last Used": key.last_used ? key.last_used : "Never",
  }));

  return (
    <PageContentWrapper>
      <PageContentHeader title="Connect" buttonOne={buttonOne} buttonFour={buttonFour} />
      <Table
        columns={columns}
        rows={rows}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        columnWidths={columnWidths}
        editButtonOverride={RefreshCcw}
      />
    </PageContentWrapper>
  );
}
