import { existsSync } from "node:fs";
import { Effect } from "effect";
import type { DataError } from "./errors.js";
import { FileNotFoundError, ParseError } from "./errors.js";
import {
  dataPath,
  requireEntity,
  writeEntity,
} from "./parser.js";
import { listByType } from "$lib/server/index-db.js";
import type { Contact, EntityWithBody } from "./types.js";

const dir = () => dataPath("CRM", "contacts");
const filePath = (id: string) => `${dir()}/${id}.md`;

/**
 * Lists all contacts from the SQLite index.
 * @returns Effect resolving to an array of Contact objects, or failing with DataError.
 */
export function listContacts(): Effect.Effect<Contact[], DataError> {
  return Effect.try({
    try: () => listByType<Contact>('contact'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

/**
 * Retrieves a single contact by ID, including its markdown body.
 * @param id - Contact identifier, e.g. "contact-jane-doe".
 * @returns Effect resolving to the contact data and markdown body, or failing with DataError.
 */
export function getContact(
  id: string,
): Effect.Effect<EntityWithBody<Contact>, DataError> {
  return requireEntity<Contact>(filePath(id), id);
}

/**
 * Updates an existing contact with the provided partial data.
 * Preserves fields not included in the patch. Replaces the markdown body if provided.
 * @param id - Contact identifier to update.
 * @param patch - Partial Contact fields to apply.
 * @param body - Optional replacement markdown body; keeps existing body if omitted.
 * @returns Effect resolving to the updated Contact, or failing with DataError.
 */
export function updateContact(
  id: string,
  patch: Partial<Contact>,
  body?: string,
): Effect.Effect<Contact, DataError> {
  return Effect.flatMap(getContact(id), ({ data, body: existingBody }) => {
    const updated = { ...data, ...patch };
    return Effect.map(
      writeEntity(
        filePath(id),
        updated as unknown as Record<string, unknown>,
        body ?? existingBody,
      ),
      () => updated,
    );
  });
}

/**
 * Creates a new contact. The ID is auto-generated from the contact name
 * (lowercased, spaces converted to dashes, non-alphanumeric characters stripped).
 * @param data - Contact fields excluding id, type, and created (auto-assigned).
 * @param body - Optional initial markdown body content.
 * @returns Effect resolving to the created Contact, or failing with DataError if the ID already exists.
 */
export function createContact(
  data: Omit<Contact, "id" | "type" | "created">,
  body = "",
): Effect.Effect<Contact, DataError> {
  const id = `contact-${data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}`;
  const contact: Contact = {
    ...data,
    id,
    type: "contact",
    created: new Date().toISOString().split("T")[0],
  };
  if (existsSync(filePath(id))) {
    return Effect.fail(new FileNotFoundError({ id: "conflict" }));
  }
  return Effect.map(
    writeEntity(
      filePath(id),
      contact as unknown as Record<string, unknown>,
      body,
    ),
    () => contact,
  );
}
