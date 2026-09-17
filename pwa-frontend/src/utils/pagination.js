// Use a fresh query per page; callers supply a stable order ending in a unique ID.
export async function fetchAllRows(queryFactory, pageSize = 500) {
  const data = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await queryFactory().range(offset, offset + pageSize - 1);
    if (page.error) return { data: null, error: page.error };
    const rows = page.data || [];
    data.push(...rows);
    if (rows.length < pageSize) return { data, error: null };
  }
}
