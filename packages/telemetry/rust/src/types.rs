//! Attribute, status and recorded-span types shared by all telemetry contexts.

use std::collections::BTreeMap;

#[derive(Clone, Debug, PartialEq)]
pub enum AttributeValue {
    String(String),
    Number(f64),
    Bool(bool),
    Strings(Vec<String>),
    Numbers(Vec<f64>),
    Bools(Vec<bool>),
}

impl From<&str> for AttributeValue {
    fn from(value: &str) -> Self {
        Self::String(value.to_string())
    }
}

impl From<String> for AttributeValue {
    fn from(value: String) -> Self {
        Self::String(value)
    }
}

impl From<f64> for AttributeValue {
    fn from(value: f64) -> Self {
        Self::Number(value)
    }
}

impl From<bool> for AttributeValue {
    fn from(value: bool) -> Self {
        Self::Bool(value)
    }
}

/// Attributes are kept sorted by name. The TypeScript version keeps insertion order.
pub type SpanAttributes = BTreeMap<String, AttributeValue>;

#[derive(Clone, Debug, Default)]
pub struct SpanOptions {
    pub name: String,
    pub attributes: SpanAttributes,
}

impl SpanOptions {
    pub fn new(name: impl Into<String>) -> Self {
        Self { name: name.into(), attributes: SpanAttributes::new() }
    }

    pub fn attribute(mut self, name: impl Into<String>, value: impl Into<AttributeValue>) -> Self {
        self.attributes.insert(name.into(), value.into());
        self
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct ErrorInfo {
    pub name: String,
    pub message: String,
}

#[derive(Clone, Debug, PartialEq)]
pub enum SpanStatus {
    Ok,
    Error(Option<ErrorInfo>),
}

#[derive(Clone, Debug, PartialEq)]
pub struct RecordedEvent {
    pub name: String,
    pub attributes: SpanAttributes,
}

#[derive(Clone, Debug, PartialEq)]
pub struct RecordedSpan {
    pub id: u64,
    pub parent_id: Option<u64>,
    pub name: String,
    pub attributes: SpanAttributes,
    pub events: Vec<RecordedEvent>,
    pub status: SpanStatus,
    pub settled: bool,
    pub end_sequence: Option<u64>,
}
