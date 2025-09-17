"use client";

import { RefreshCcw } from "lucide-react";
import { useState } from "react";

import InputForm from "@/app/components/InputForm/InputForm";
import { IInputFormRow, IInputFormProps } from "@/app/components/InputForm/InputForm";
import PageContentWrapper from "@/app/components/PageContentWrapper/PageContentWrapper";
import Table from "@/app/components/Table/Table";
import { useUser } from "@/app/context/UserProvider";
import { IApiKeyInternal, IApiKeyInternalInput } from "@/app/interfaces/IApiKey";

import PageContentHeader, { IButton } from "../../components/PageContentHeader/PageContentHeader";
import ApiKeyDisplay from "@/app/components/ApiKeyDisplay/ApiKeyDisplay";

const buttonFour: IButton = {
  name: "API Docs",
  onClick: () => { }
}

const columns = ["Description", "Created", "Expires", "Last Used"];
const columnWidths = [40, 20, 20, 20];

export default function ConnectPage() {
  const { state, dispatch } = useUser();
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [keyToDisplay, setKeyToDisplay] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<IApiKeyInternalInput>({
    description: "",
    expires: null,
  });
  const [apiKeyToRefresh, setApiKeyToRefresh] = useState<IApiKeyInternalInput | null>(null);

  const handleEdit = (rowIndex: number) => {
    const key = state.api_keys[rowIndex];
    setApiKeyToRefresh(key);
    setFormValues(key);
    setIsFormOpen(true);
  };

  const handleDelete = async (rowIndex: number) => {
    const key = state.api_keys[rowIndex];
    try {
      const res = await fetch(`/api/internal/user/key?description=${key.description}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error deleting api key: ${key.description}.`);

      // update cached state
      dispatch({ type: "DELETE_API_KEY", payload: key });
    } catch (error) {
      console.error(error);
      alert(error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const description = formValues.description.trim();
    const expires = formValues.expires ? new Date(formValues.expires) : null;

    // validate input
    if (!description) {
      alert("Please fill out all required fields.");
      return;
    }

    if (expires && expires < new Date()) {
      alert("Expiration date cannot be in the past")
      return;
    }

    const newApiKey: IApiKeyInternalInput = {
      description: description,
      expires: expires ? expires.toISOString().split("T")[0] : null
    }

    let success = false;

    try {
      if (apiKeyToRefresh) {
        // update the skill
        const editPayload: IApiKeyInternalInput = {
          description: apiKeyToRefresh.description,
          expires: newApiKey.expires
        }
        const res = await fetch("/api/internal/user/key", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const oldKey: IApiKeyInternal = {
          ...apiKeyToRefresh,
          created: "",
          last_used: null
        }

        // update cached state
        dispatch({ type: "UPDATE_API_KEY", payload: { old: oldKey, new: data.key } });
      } else {
        // Add the skill
        const res = await fetch("/api/internal/user/key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newApiKey),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // update the cached user
        dispatch({ type: "ADD_API_KEY", payload: data.key });
      }

      success = true;
    } catch (err) {
      console.error(err);
      const error = err as Error;
      alert(error.message);
    }

    // reset form and show generated key
    setFormValues({ description: "", expires: null });
    setIsFormOpen(false);
    setApiKeyToRefresh(null);

    if (success) setKeyToDisplay(description);
  }

  const onClose = () => {
    setIsFormOpen(false);
  }

  const onApiKeyDisplayClose = () => {
    setKeyToDisplay(null);
  }

  const buttonOne: IButton = {
    name: "Generate API Key",
    onClick: () => {
      setFormValues({
        description: "",
        expires: null,
      });
      setApiKeyToRefresh(null);
      setIsFormOpen(true);
    }
  }

  const rows = state.api_keys.map((key) => ({
    "Description": key.description,
    "Created": key.created.split("T")[0],
    "Expires": key.expires ? key.expires.split("T")[0] : "Never",
    "Last Used": key.last_used ? key.last_used.split("T")[0] : "Never",
  }));

  const inputRows: IInputFormRow[] = [
    {
      inputOne: {
        label: "API Key Description",
        name: "description",
        type: "text",
        placeholder: "Enter description for API Key",
        required: true,
        onChange: handleChange,
        value: formValues.description,
        disabled: !!apiKeyToRefresh
      }
    }, {
      inputOne: {
        label: "Expiration Date",
        name: "expires",
        type: "date",
        placeholder: "Enter expiration date or leave empty",
        required: false,
        onChange: handleChange,
        value: formValues.expires ? formValues.expires.split("T")[0] : ""
      }
    }
  ]

  const formProps: IInputFormProps = {
    title: apiKeyToRefresh ? "Refresh API Key" : "Generate API Key",
    buttonLabel: apiKeyToRefresh ? "Refresh" : "Generate",
    onSubmit: onSubmit,
    inputRows: inputRows,
    onClose: onClose
  }

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

      {
        isFormOpen &&
        <InputForm
          title={formProps.title}
          buttonLabel={formProps.buttonLabel}
          onSubmit={formProps.onSubmit}
          inputRows={formProps.inputRows}
          onClose={formProps.onClose}
        />
      }

      {
        keyToDisplay &&
        <ApiKeyDisplay keyDescription={keyToDisplay} onClose={onApiKeyDisplayClose} />
      }
    </PageContentWrapper>
  );
}