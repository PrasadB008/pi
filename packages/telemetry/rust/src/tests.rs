use super::*;

fn attrs(pairs: &[(&str, AttributeValue)]) -> SpanAttributes {
    pairs.iter().map(|(k, v)| (k.to_string(), v.clone())).collect()
}

#[test]
fn records_nested_spans_in_start_order() {
    let ctx = InMemoryTelemetryContext::new();
    let result: Result<i32, String> = ctx.start_span(SpanOptions::new("parent"), |span| {
        span.start_span(SpanOptions::new("child").attribute("k", "v"), |_| Ok::<_, String>(1))
    });
    assert_eq!(result, Ok(1));
    let spans = ctx.spans();
    assert_eq!(spans.len(), 2);
    assert_eq!((spans[0].id, spans[0].parent_id), (1, None));
    assert_eq!((spans[1].id, spans[1].parent_id), (2, Some(1)));
    assert_eq!(spans[1].attributes, attrs(&[("k", "v".into())]));
    assert_eq!(spans[1].end_sequence, Some(1));
    assert_eq!(spans[0].end_sequence, Some(2));
    assert!(spans.iter().all(|s| s.settled && s.status == SpanStatus::Ok));
}

#[test]
fn error_result_sets_error_status() {
    let ctx = InMemoryTelemetryContext::new();
    let result: Result<(), String> =
        ctx.start_span(SpanOptions::new("s"), |_| Err("boom".to_string()));
    assert_eq!(result, Err("boom".to_string()));
    match &ctx.spans()[0].status {
        SpanStatus::Error(Some(info)) => assert_eq!(info.message, "boom"),
        other => panic!("unexpected status {other:?}"),
    }
}

#[test]
fn explicit_status_wins_over_automatic_error() {
    let ctx = InMemoryTelemetryContext::new();
    let _: Result<(), String> = ctx.start_span(SpanOptions::new("s"), |span| {
        span.set_status(SpanStatus::Ok);
        Err("ignored".to_string())
    });
    assert_eq!(ctx.spans()[0].status, SpanStatus::Ok);
}

#[test]
fn set_attributes_merges_and_events_are_recorded() {
    let two = AttributeValue::Number(2.0);
    let ctx = InMemoryTelemetryContext::new();
    let _: Result<(), String> =
        ctx.start_span(SpanOptions::new("s").attribute("a", 1.0_f64), |span| {
            span.set_attributes(attrs(&[("a", two.clone()), ("b", true.into())]));
            span.add_event("e", attrs(&[("x", "y".into())]));
            Ok(())
        });
    let span = &ctx.spans()[0];
    assert_eq!(span.attributes, attrs(&[("a", two), ("b", true.into())]));
    assert_eq!(span.events.len(), 1);
    assert_eq!(span.events[0].name, "e");
}

#[test]
fn updates_after_settle_are_ignored_and_settled_parent_gives_noop_child() {
    let ctx = InMemoryTelemetryContext::new();
    let mut leaked = None;
    let _: Result<(), String> = ctx.start_span(SpanOptions::new("s"), |span| {
        leaked = Some(span.clone());
        Ok(())
    });
    let leaked = leaked.unwrap();
    leaked.add_event("late", SpanAttributes::new());
    leaked.set_status(SpanStatus::Error(None));
    let ran: Result<bool, String> = leaked.start_span(SpanOptions::new("late-child"), |_| Ok(true));
    assert_eq!(ran, Ok(true));
    let spans = ctx.spans();
    assert_eq!(spans.len(), 1);
    assert!(spans[0].events.is_empty());
    assert_eq!(spans[0].status, SpanStatus::Ok);
}

#[test]
fn panic_settles_span_as_error() {
    let ctx = InMemoryTelemetryContext::new();
    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let _: Result<(), String> = ctx.start_span(SpanOptions::new("s"), |_| panic!("bad"));
    }));
    assert!(outcome.is_err());
    let span = &ctx.spans()[0];
    assert!(span.settled);
    assert_eq!(span.status, SpanStatus::Error(None));
}

#[test]
fn noop_span_runs_callback_and_records_nothing() {
    let span = Span::noop();
    span.add_event("e", SpanAttributes::new());
    let result: Result<i32, String> = span.start_span(SpanOptions::new("x"), |_| Ok(7));
    assert_eq!(result, Ok(7));
}
