-- +goose Up
-- +goose StatementBegin
ALTER TABLE tasks ADD COLUMN dataset_url VARCHAR(2048) NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE tasks DROP COLUMN dataset_url;
-- +goose StatementEnd
