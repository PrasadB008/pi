//! Rust port of `@earendil-works/telemetry`.
//!
//! The API is synchronous: a span callback returns a `Result`, and an `Err` or a panic
//! marks the span as failed unless the callback set a status explicitly.

mod types;

use std::fmt::Display;
use std::sync::{Arc, Mutex, MutexGuard};

pub use types::{
    AttributeValue, ErrorInfo, RecordedEvent, RecordedSpan, SpanAttributes, SpanOptions,
    SpanStatus,
};

/// Something that can start spans.
pub trait TelemetryContext {
    fn start_span<T, E, F>(&self, options: SpanOptions, callback: F) -> Result<T, E>
    where
        E: Display,
        F: FnOnce(&Span) -> Result<T, E>;
}

struct Record {
    span: RecordedSpan,
    explicit_status: bool,
}

struct State {
    records: Vec<Record>,
    next_span_id: u64,
    next_end_sequence: u64,
}

type Shared = Arc<Mutex<State>>;

fn lock(state: &Shared) -> MutexGuard<'_, State> {
    // Recording is passive: a poisoned lock still holds usable data.
    state.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

fn index(id: u64) -> usize {
    (id - 1) as usize
}

/// A running span. A span without a recorder ignores everything (the no-op context).
#[derive(Clone)]
pub struct Span {
    target: Option<(Shared, u64)>,
}

impl Span {
    /// Shared no-op span used when an application does not provide a context.
    pub fn noop() -> Self {
        Self { target: None }
    }

    pub fn add_event(&self, name: impl Into<String>, attributes: SpanAttributes) {
        self.with_open_record(|record| {
            record.span.events.push(RecordedEvent { name: name.into(), attributes });
        });
    }

    /// Merges attributes into the span; existing names are overwritten.
    pub fn set_attributes(&self, attributes: SpanAttributes) {
        self.with_open_record(|record| record.span.attributes.extend(attributes));
    }

    pub fn set_status(&self, status: SpanStatus) {
        self.with_open_record(|record| {
            record.span.status = status;
            record.explicit_status = true;
        });
    }

    fn with_open_record(&self, update: impl FnOnce(&mut Record)) {
        if let Some((state, id)) = &self.target {
            let mut guard = lock(state);
            let record = &mut guard.records[index(*id)];
            if !record.span.settled {
                update(record);
            }
        }
    }
}

impl TelemetryContext for Span {
    fn start_span<T, E, F>(&self, options: SpanOptions, callback: F) -> Result<T, E>
    where
        E: Display,
        F: FnOnce(&Span) -> Result<T, E>,
    {
        match &self.target {
            None => callback(self),
            Some((state, id)) => start_recorded(state, Some(*id), options, callback),
        }
    }
}

/// Marks the span failed if the callback panics before it settles normally.
struct SettleGuard<'a> {
    state: &'a Shared,
    id: u64,
    done: bool,
}

impl Drop for SettleGuard<'_> {
    fn drop(&mut self) {
        if !self.done {
            settle(self.state, self.id, Some(SpanStatus::Error(None)));
        }
    }
}

fn settle(state: &Shared, id: u64, failure: Option<SpanStatus>) {
    let mut guard = lock(state);
    let sequence = guard.next_end_sequence;
    let record = &mut guard.records[index(id)];
    if record.span.settled {
        return;
    }
    if let (Some(status), false) = (failure, record.explicit_status) {
        record.span.status = status;
    }
    record.span.settled = true;
    record.span.end_sequence = Some(sequence);
    guard.next_end_sequence += 1;
}

fn start_recorded<T, E, F>(
    state: &Shared,
    parent: Option<u64>,
    options: SpanOptions,
    callback: F,
) -> Result<T, E>
where
    E: Display,
    F: FnOnce(&Span) -> Result<T, E>,
{
    let id = {
        let mut guard = lock(state);
        let parent_settled = parent.is_some_and(|p| guard.records[index(p)].span.settled);
        if parent_settled {
            None
        } else {
            let id = guard.next_span_id;
            guard.next_span_id += 1;
            guard.records.push(Record {
                span: RecordedSpan {
                    id,
                    parent_id: parent,
                    name: options.name,
                    attributes: options.attributes,
                    events: Vec::new(),
                    status: SpanStatus::Ok,
                    settled: false,
                    end_sequence: None,
                },
                explicit_status: false,
            });
            Some(id)
        }
    };
    let Some(id) = id else {
        return callback(&Span::noop());
    };

    let mut settle_guard = SettleGuard { state, id, done: false };
    let span = Span { target: Some((state.clone(), id)) };
    let result = callback(&span);
    settle_guard.done = true;
    let failure = result.as_ref().err().map(|error| {
        SpanStatus::Error(Some(ErrorInfo {
            name: std::any::type_name::<E>().to_string(),
            message: error.to_string(),
        }))
    });
    settle(state, id, failure);
    result
}

/// Backend-neutral context that records spans in process memory.
/// Create a fresh instance to isolate tests or independent recording scopes.
pub struct InMemoryTelemetryContext {
    state: Shared,
}

impl Default for InMemoryTelemetryContext {
    fn default() -> Self {
        Self::new()
    }
}

impl InMemoryTelemetryContext {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(State {
                records: Vec::new(),
                next_span_id: 1,
                next_end_sequence: 1,
            })),
        }
    }

    /// Returns detached snapshots in span-start order.
    pub fn spans(&self) -> Vec<RecordedSpan> {
        lock(&self.state).records.iter().map(|record| record.span.clone()).collect()
    }
}

impl TelemetryContext for InMemoryTelemetryContext {
    fn start_span<T, E, F>(&self, options: SpanOptions, callback: F) -> Result<T, E>
    where
        E: Display,
        F: FnOnce(&Span) -> Result<T, E>,
    {
        start_recorded(&self.state, None, options, callback)
    }
}

#[cfg(test)]
mod tests;
