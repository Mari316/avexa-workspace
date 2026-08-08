"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppDataState } from "../../context/AppDataContext";
import {
  openHeaderDropdown,
  subscribeHeaderDropdown,
} from "../../lib/headerDropdowns";
import { formatContactName } from "../../lib/mockData";

import styles from "./SearchBar.module.css";

type SearchResultType = "Client" | "Project" | "Task" | "Contact";

type SearchResult = {
  id: string;
  type: SearchResultType;
  label: string;
  href: string;
};

function searchItems(items: SearchResult[], query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return items.filter((item) =>
    item.label.toLowerCase().includes(normalizedQuery),
  );
}

export default function SearchBar() {
  const { clients, projects, tasks, contacts } = useAppDataState();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const searchIndex = useMemo(() => {
    const clientResults: SearchResult[] = clients.map((client) => ({
      id: `client-${client.slug}`,
      type: "Client",
      label: client.name,
      href: `/clients/${client.slug}`,
    }));

    const projectResults: SearchResult[] = projects.map((project) => ({
      id: `project-${project.slug}`,
      type: "Project",
      label: project.name,
      href: `/projects/${project.slug}`,
    }));

    const taskResults: SearchResult[] = tasks.map((task) => ({
      id: `task-${task.slug}`,
      type: "Task",
      label: task.title,
      href: `/tasks/${task.slug}`,
    }));

    const contactResults: SearchResult[] = contacts.map((contact) => ({
      id: `contact-${contact.id}`,
      type: "Contact",
      label: formatContactName(contact.firstName, contact.lastName),
      href: `/contacts/${contact.slug}`,
    }));

    return [
      ...clientResults,
      ...projectResults,
      ...taskResults,
      ...contactResults,
    ];
  }, [clients, projects, tasks, contacts]);

  const results = useMemo(
    () => searchItems(searchIndex, query),
    [searchIndex, query],
  );

  const showDropdown = isOpen && query.trim().length > 0;

  useEffect(() => {
    return subscribeHeaderDropdown((opened) => {
      if (opened === "notifications" || opened === "userMenu") {
        setIsOpen(false);
      }
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.container}>
        <Search size={18} className={styles.icon} aria-hidden="true" />

        <input
          className={styles.input}
          type="search"
          placeholder="Search clients, projects, tasks, contacts..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            openHeaderDropdown("search");
          }}
          onFocus={() => {
            setIsOpen(true);
            openHeaderDropdown("search");
          }}
          aria-label="Search clients, projects, tasks, and contacts"
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          role="combobox"
        />
      </div>

      {showDropdown && (
        <div
          id="global-search-results"
          className={styles.dropdown}
          role="listbox"
          aria-label="Search results"
        >
          {results.length === 0 ? (
            <p className={styles.noResults}>No results found</p>
          ) : (
            results.map((result) => (
              <Link
                key={result.id}
                href={result.href}
                className={styles.resultItem}
                role="option"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  setQuery("");
                  setIsOpen(false);
                }}
              >
                <span
                  className={`${styles.resultType} ${styles[`type${result.type}`]}`}
                >
                  {result.type}
                </span>
                <span className={styles.resultLabel}>{result.label}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
