export const typeDefs = /* GraphQL */ `
  type Note {
    _id: ID!
    title: String!
    content: String!
    category: String!
    tags: [String!]!
    isPinned: Boolean!
    isArchived: Boolean!
    color: String!
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }

  type CategoryResult {
    categories: [String!]!
  }

  type Settings {
    theme: String!
  }

  type MutationResult {
    ok: Boolean!
    error: String
  }

  type SaveNoteResult {
    ok: Boolean!
    note: Note
    error: String
  }

  input NoteInput {
    _id: ID
    title: String
    content: String
    category: String
    tags: [String!]
    color: String
    isPinned: Boolean
    isArchived: Boolean
    userId: ID
    createdAt: String
    updatedAt: String
  }

  type Query {
    notes(archived: Boolean): [Note!]!
    categories: [String!]!
    settings: Settings!
  }

  type Mutation {
    saveNote(input: NoteInput!): SaveNoteResult!
    deleteNote(id: ID!): MutationResult!
    createCategory(name: String!): CategoryResult!
    renameCategory(oldName: String!, newName: String!): MutationResult!
    deleteCategory(name: String!): MutationResult!
    updateTheme(theme: String!): Settings!
  }
`;
