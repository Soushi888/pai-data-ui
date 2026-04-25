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

export function listContacts(): Effect.Effect<Contact[], DataError> {
  return Effect.try({
    try: () => listByType<Contact>('contact'),
    catch: (e) => new ParseError({ file: dir(), cause: e }),
  })
}

export function getContact(
  id: string,
): Effect.Effect<EntityWithBody<Contact>, DataError> {
  return requireEntity<Contact>(filePath(id), id);
}

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
