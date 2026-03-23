import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Save, Trash2, X } from "lucide-react";
import { axiosPublic } from "../api/axios";
import styles from "../styles/Admin.module.css";

const EMPTY_FORM = {
  key: "",
  type: "avatar_frame",
  name: "",
  asset_url: "",
  rarity: "epic",
  enabled: true,
};

function CosmeticsManager() {
  const navigate = useNavigate();
  const [cosmetics, setCosmetics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [uploadingCreateImage, setUploadingCreateImage] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const createFileInputRef = useRef(null);

  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const editFileInputRef = useRef(null);

  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchCosmetics();
  }, []);

  const fetchCosmetics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosPublic.get("/v1/admin/cosmetics", { withCredentials: true });
      if (res?.data?.success) {
        setCosmetics(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setCosmetics([]);
        setError(res?.data?.message || "Failed to fetch cosmetics");
      }
    } catch (err) {
      setCosmetics([]);
      setError(err?.response?.data?.message || err?.message || "Failed to fetch cosmetics");
    } finally {
      setLoading(false);
    }
  };

  const filteredCosmetics = useMemo(() => {
    if (filterType === "all") return cosmetics;
    return cosmetics.filter((item) => item?.type === filterType);
  }, [cosmetics, filterType]);

  const handleCreate = async () => {
    if (!createForm.key || !createForm.name || !createForm.asset_url || !createForm.type) {
      alert("Please fill out key, type, name, and asset URL.");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        key: String(createForm.key).trim(),
        type: String(createForm.type).trim(),
        name: String(createForm.name).trim(),
        asset_url: String(createForm.asset_url).trim(),
        rarity: String(createForm.rarity || "epic").trim() || "epic",
        enabled: Boolean(createForm.enabled),
      };

      const res = await axiosPublic.post("/v1/admin/cosmetics", payload, { withCredentials: true });
      if (!res?.data?.success) {
        alert(res?.data?.message || "Failed to create cosmetic.");
        return;
      }

      setCreateForm(EMPTY_FORM);
      await fetchCosmetics();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to create cosmetic.");
    } finally {
      setCreating(false);
    }
  };

  const uploadCreateImage = async (file) => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    setUploadingCreateImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", createForm.type || "avatar_frame");

      const baseUrl = String(axiosPublic.defaults.baseURL || "").replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/v1/admin/cosmetics/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.success) {
        alert(payload?.message || `Failed to upload image (${response.status}).`);
        return;
      }

      const uploadedUrl = payload?.data?.url || "";
      if (uploadedUrl) {
        setCreateForm((prev) => ({ ...prev, asset_url: uploadedUrl }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to upload image.");
    } finally {
      setUploadingCreateImage(false);
    }
  };

  const handleCreateFileSelected = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    await uploadCreateImage(file);
  };

  const handleEdit = (row) => {
    setEditingKey(row.key);
    setEditForm({
      type: row.type || "avatar_frame",
      name: row.name || "",
      asset_url: row.asset_url || "",
      rarity: row.rarity || "epic",
      enabled: Boolean(row.enabled),
    });
  };

  const uploadEditImage = async (file) => {
    if (!file) {
      alert("Please select an image first.");
      return;
    }

    setUploadingEditImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", editForm.type || "avatar_frame");

      const baseUrl = String(axiosPublic.defaults.baseURL || "").replace(/\/+$/, "");
      const response = await fetch(`${baseUrl}/v1/admin/cosmetics/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.success) {
        alert(payload?.message || `Failed to upload image (${response.status}).`);
        return;
      }

      const uploadedUrl = payload?.data?.url || "";
      if (uploadedUrl) {
        setEditForm((prev) => ({ ...prev, asset_url: uploadedUrl }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to upload image.");
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleEditFileSelected = async (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;
    await uploadEditImage(file);
  };

  const handleSave = async () => {
    if (!editingKey) return;
    if (!editForm.name || !editForm.asset_url) {
      alert("Name and asset URL are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: String(editForm.type || "avatar_frame").trim(),
        name: String(editForm.name).trim(),
        asset_url: String(editForm.asset_url).trim(),
        rarity: String(editForm.rarity || "epic").trim() || "epic",
        enabled: Boolean(editForm.enabled),
      };

      const res = await axiosPublic.patch(`/v1/admin/cosmetics/${encodeURIComponent(editingKey)}`, payload, {
        withCredentials: true,
      });

      if (!res?.data?.success) {
        alert(res?.data?.message || "Failed to save cosmetic.");
        return;
      }

      setEditingKey(null);
      setEditForm({});
      await fetchCosmetics();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to save cosmetic.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key) => {
    const ok = window.confirm(`Delete cosmetic "${key}"? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await axiosPublic.delete(`/v1/admin/cosmetics/${encodeURIComponent(key)}`, {
        withCredentials: true,
      });

      if (!res?.data?.success) {
        alert(res?.data?.message || "Failed to delete cosmetic.");
        return;
      }

      if (editingKey === key) {
        setEditingKey(null);
        setEditForm({});
      }
      await fetchCosmetics();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete cosmetic.");
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <section className={styles.section}>
          <div className={styles.state}>
            <h1>Loading cosmetics...</h1>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.button}
              type="button"
              onClick={() => navigate("/admin")}
              style={{ marginRight: 16 }}
            >
              <ArrowLeft size={16} style={{ marginRight: 4 }} />
              Back to Admin
            </button>
            <h2 className={styles.title}>Cosmetics</h2>
          </div>
          <button className={styles.button} type="button" onClick={fetchCosmetics}>
            Refresh
          </button>
        </div>

        <p className={styles.subtitle}>Manage avatar frames and terminal skins used in rewards and user profiles.</p>
        {error ? <p className={styles.errorText}>{error}</p> : null}

        <div className={styles.panel} style={{ marginBottom: 16 }}>
          <h3 className={styles.panelTitle}>Add Cosmetic</h3>
          <div className={styles.formGrid} style={{ marginTop: 12 }}>
            <div className={styles.formGroup}>
              <label>Key</label>
              <input
                type="text"
                value={createForm.key}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="e.g. frame_gold"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Type</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="avatar_frame">avatar_frame</option>
                <option value="terminal_skin">terminal_skin</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Rarity</label>
              <input
                type="text"
                value={createForm.rarity}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, rarity: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Asset URL</label>
              <input
                type="text"
                value={createForm.asset_url}
                readOnly
                placeholder="Upload image to generate URL"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Upload Asset</label>
              <input
                ref={createFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleCreateFileSelected}
              />
              <div className={styles.inlineActions} style={{ justifyContent: "flex-start" }}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={uploadingCreateImage}
                >
                  {uploadingCreateImage ? "Uploading..." : "Upload Asset"}
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Preview</label>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 10,
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {createForm.asset_url ? (
                  <img
                    src={createForm.asset_url}
                    alt="Cosmetic preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>No image</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={createForm.enabled}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                  style={{ width: "auto", margin: 0 }}
                />
                Enabled
              </label>
            </div>
          </div>

          <div className={styles.formActions} style={{ marginTop: 12, paddingTop: 12 }}>
            <button className={styles.button} type="button" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Cosmetic"}
            </button>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.quizHeaderRow}>
            <h3 className={styles.panelTitle}>All Cosmetics ({filteredCosmetics.length})</h3>
            <div className={styles.inlineActions}>
              <label style={{ fontSize: 12, opacity: 0.8 }}>Filter</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">all</option>
                <option value="avatar_frame">avatar_frame</option>
                <option value="terminal_skin">terminal_skin</option>
              </select>
            </div>
          </div>

          {filteredCosmetics.length === 0 ? (
            <p style={{ marginTop: 12, opacity: 0.75 }}>No cosmetics found.</p>
          ) : (
            filteredCosmetics.map((row) => (
              <div key={row.key} className={styles.exerciseRow}>
                {editingKey === row.key ? (
                  <div className={styles.exerciseEditor}>
                    <h3>Edit Cosmetic: {row.key}</h3>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Type</label>
                        <select
                          value={editForm.type || "avatar_frame"}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="avatar_frame">avatar_frame</option>
                          <option value="terminal_skin">terminal_skin</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Rarity</label>
                        <input
                          type="text"
                          value={editForm.rarity || ""}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, rarity: e.target.value }))}
                        />
                      </div>

                      <div className={styles.formGroupFull}>
                        <label>Name</label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Asset URL</label>
                        <input
                          type="text"
                          value={editForm.asset_url || ""}
                          readOnly
                          placeholder="Upload image to generate URL"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label>Upload New Asset</label>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          style={{ display: "none" }}
                          onChange={handleEditFileSelected}
                        />
                        <div className={styles.inlineActions} style={{ justifyContent: "flex-start" }}>
                          <button
                            className={styles.button}
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            disabled={uploadingEditImage}
                          >
                            {uploadingEditImage ? "Uploading..." : "Upload Asset"}
                          </button>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label>Preview</label>
                        <div
                          style={{
                            width: 88,
                            height: 88,
                            borderRadius: 10,
                            border: "1px solid rgba(148, 163, 184, 0.35)",
                            background: "rgba(15, 23, 42, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {editForm.asset_url ? (
                            <img
                              src={editForm.asset_url}
                              alt="Cosmetic preview"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, opacity: 0.7 }}>No image</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(editForm.enabled)}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                            style={{ width: "auto", margin: 0 }}
                          />
                          Enabled
                        </label>
                      </div>
                    </div>

                    <div className={styles.formActions} style={{ marginTop: 12, paddingTop: 12 }}>
                      <button className={styles.button} type="button" onClick={handleSave} disabled={saving}>
                        <Save size={16} style={{ marginRight: 4 }} />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className={styles.button}
                        type="button"
                        onClick={() => {
                          setEditingKey(null);
                          setEditForm({});
                        }}
                        disabled={saving}
                      >
                        <X size={16} style={{ marginRight: 4 }} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.exerciseLeft}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 8,
                            border: "1px solid rgba(148, 163, 184, 0.35)",
                            background: "rgba(15, 23, 42, 0.06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {row.asset_url ? (
                            <img
                              src={row.asset_url}
                              alt={row.name || row.key}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 10, opacity: 0.7 }}>N/A</span>
                          )}
                        </div>
                        <div className={styles.exerciseTitle}>{row.name || row.key}</div>
                      </div>
                      <div className={styles.exerciseMeta}>
                        Key: {row.key} · Type: {row.type} · Rarity: {row.rarity || "-"} · Status:{" "}
                        <span className={row.enabled ? styles.published : styles.draft}>
                          {row.enabled ? "enabled" : "disabled"}
                        </span>
                      </div>
                      <div className={styles.exerciseDescription}>{row.asset_url}</div>
                    </div>
                    <div className={styles.exerciseActions}>
                      <button className={styles.button} type="button" onClick={() => handleEdit(row)}>
                        <Edit size={16} />
                      </button>
                      <button className={styles.button} type="button" onClick={() => handleDelete(row.key)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default CosmeticsManager;
